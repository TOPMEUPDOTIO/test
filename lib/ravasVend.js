const endpoint = process.env.RAVASVEND_URL || 'https://desertretail.co.za:19001/Service.asmx';
const namespace = process.env.RAVASVEND_NAMESPACE || 'http://ravasvend.co.za/';

const escapeXml = (value) => String(value).replace(/[<>&'\"]/g, (character) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[character]);
const tag = (name, value) => value === undefined || value === null || value === '' ? '' : `<${name}>${escapeXml(value)}</${name}>`;
const msgId = () => {
  const date = new Date();
  const stamp = [date.getFullYear(), date.getMonth() + 1, date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds()].map((part) => String(part).padStart(2, '0')).join('');
  return `${stamp}${String(Math.floor(Math.random() * 1000000)).padStart(6, '0')}`;
};

const meterIdentifier = (meter) => `<meterIdentifier>${tag('msno', meter)}</meterIdentifier>`;
const baseRequest = (terminalId) => `${tag('terminalMsgID', `topmeup-${Date.now()}`)}${tag('terminalID', terminalId)}${tag('msgID', msgId())}<authCred>${tag('opName', process.env.RAVASVEND_USERNAME)}${tag('password', process.env.RAVASVEND_PASSWORD)}</authCred>`;

function soapRequest(operation, fields) {
  return `<?xml version="1.0" encoding="utf-8"?><soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"><soap:Body><${operation} xmlns="${namespace}"><req>${fields}</req></${operation}></soap:Body></soap:Envelope>`;
}

async function callRavas(operation, fields) {
  if (!process.env.RAVASVEND_USERNAME || !process.env.RAVASVEND_PASSWORD) throw new Error('RAVASVend credentials are not configured.');
  const response = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'text/xml; charset=utf-8', SOAPAction: `${namespace}${operation}` }, body: soapRequest(operation, fields), signal: AbortSignal.timeout(35000) });
  const text = await response.text();
  if (!response.ok) throw new Error(`RAVASVend returned HTTP ${response.status}.`);
  if (/<(?:soap:)?Fault\b|<hasFault>true<\/hasFault>/i.test(text)) {
    const faultCode = valueFromXml(text, ['code', 'faultCode']);
    const faultMessage = valueFromXml(text, ['operatorMsg', 'message', 'description']);
    throw new Error(`RAVASVend fault${faultCode ? ` ${faultCode}` : ''}${faultMessage ? `: ${faultMessage}` : '.'}`);
  }
  return text;
}

const valueFromXml = (xml, names) => {
  for (const name of names) {
    const match = xml.match(new RegExp(`<[^>]*${name}[^>]*>([^<]*)<`, 'i'));
    if (match) return match[1].trim();
  }
  return null;
};

export async function confirmCustomer(meter) {
  const xml = await callRavas('ConfirmCustomer', `${baseRequest(meter)}${tag('amount', '0')}${tag('voucherCode', 'UNKNOWN')}${meterIdentifier(meter)}${tag('allSuppliers', 'false')}`);
  return { meter, voucherCode: valueFromXml(xml, ['voucherCode']), address: valueFromXml(xml, ['address']), customerName: valueFromXml(xml, ['name']), debts: valueFromXml(xml, ['debts']), maxVendAmt: valueFromXml(xml, ['maxVendAmt']), minVendAmt: valueFromXml(xml, ['minVendAmt']), capabilities: valueFromXml(xml, ['capability']) };
}

export async function lookupMeter(meter) {
  return confirmCustomer(meter);
}

export async function vendElectricity(meter, amount, voucherCode) {
  const confirmed = voucherCode ? { voucherCode } : await confirmCustomer(meter);
  if (!confirmed.voucherCode || confirmed.voucherCode === 'UNKNOWN') throw new Error('RAVASVend did not return a voucher code for this meter.');
  const fields = `${baseRequest(meter)}${tag('voucherCode', confirmed.voucherCode)}${meterIdentifier(meter)}${tag('purchaseValue', amount.toFixed(2))}<tender>${tag('tenderType', 'CREDITCARD')}${tag('fromAccount', 'NONE')}</tender>${tag('receiptFormat', 'EN_FORMATED_80')}${tag('terminalChannel', 'WEB')}${tag('terminalCompanyName', 'topmeup')}${tag('terminalOperator', 'topmeup')}`;
  const xml = await callRavas('CreditVend', fields);
  return { token: valueFromXml(xml, ['token']), units: valueFromXml(xml, ['units']), receipt: valueFromXml(xml, ['receiptNumber', 'receipt']), smsReceipt: valueFromXml(xml, ['smsreceipt']) };
}
