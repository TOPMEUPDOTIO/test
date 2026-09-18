const endpoint = process.env.RAVASVEND_URL || 'https://desertretail.co.za:19001/Service.asmx';

const escapeXml = (value) => String(value).replace(/[<>&'\"]/g, (character) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[character]);

function soapRequest(operation, values) {
  const namespace = process.env.RAVASVEND_NAMESPACE || 'http://tempuri.org/';
  const fields = Object.entries(values).map(([key, value]) => `<${key}>${escapeXml(value)}</${key}>`).join('');
  return `<?xml version="1.0" encoding="utf-8"?><soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"><soap:Body><${operation} xmlns="${namespace}"><Username>${escapeXml(process.env.RAVASVEND_USERNAME || '')}</Username><Password>${escapeXml(process.env.RAVASVEND_PASSWORD || '')}</Password>${fields}</${operation}></soap:Body></soap:Envelope>`;
}

async function callRavas(operation, values) {
  if (!process.env.RAVASVEND_USERNAME || !process.env.RAVASVEND_PASSWORD) throw new Error('RAVASVend credentials are not configured.');
  const response = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'text/xml; charset=utf-8', SOAPAction: `${process.env.RAVASVEND_NAMESPACE || 'http://tempuri.org/'}${operation}` }, body: soapRequest(operation, values), signal: AbortSignal.timeout(15000) });
  const text = await response.text();
  if (!response.ok) throw new Error(`RAVASVend returned HTTP ${response.status}.`);
  if (/<(?:soap:)?Fault\b/i.test(text)) throw new Error('RAVASVend returned a SOAP fault.');
  return text;
}

const valueFromXml = (xml, names) => {
  for (const name of names) {
    const match = xml.match(new RegExp(`<[^>]*${name}[^>]*>([^<]*)<`, 'i'));
    if (match) return match[1].trim();
  }
  return null;
};

export async function lookupMeter(meter) {
  const xml = await callRavas(process.env.RAVASVEND_LOOKUP_OPERATION || 'MeterLookup', { MeterNumber: meter });
  return { meter, address: valueFromXml(xml, ['Address', 'MeterAddress']), raw: xml };
}

export async function vendElectricity(meter, amount) {
  const xml = await callRavas(process.env.RAVASVEND_VEND_OPERATION || 'Vend', { MeterNumber: meter, Amount: amount.toFixed(2) });
  return { token: valueFromXml(xml, ['Token', 'ElectricityToken', 'Voucher']), units: valueFromXml(xml, ['Units', 'Kwh']), receipt: valueFromXml(xml, ['Receipt', 'ReceiptNumber']), raw: xml };
}