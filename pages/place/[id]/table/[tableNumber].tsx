/**
 * Table Number Redirect
 * Path: pages/place/[id]/table/[tableNumber].tsx
 * URL: tavvy.com/place/[uuid]/table/5
 *
 * QR codes at tables point here. Redirects to the ordering page
 * with the table number as a query parameter.
 */

import { GetServerSideProps } from 'next';

export default function TableRedirect() {
  return null;
}

export const getServerSideProps: GetServerSideProps = async ({ params }) => {
  const { id, tableNumber } = params as { id: string; tableNumber: string };

  return {
    redirect: {
      destination: `/place/${id}/order?table=${encodeURIComponent(tableNumber)}`,
      permanent: false,
    },
  };
};
