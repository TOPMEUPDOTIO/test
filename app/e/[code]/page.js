import DonorCheckout from '../../../components/DonorCheckout';

export default async function RequestCheckoutPage({ params }) {
  return <DonorCheckout code={params.code} />;
}
