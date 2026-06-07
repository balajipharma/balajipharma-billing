export async function downloadInvoicePdf(id: number | string, isBilling: boolean): Promise<void> {
  const endpoint = isBilling ? `/api/invoice/pdf/${id}` : `/api/purchase/pdf/${id}`;
  
  const response = await fetch(endpoint);
  if (!response.ok) {
    const errData = await response.json().catch(() => null);
    throw new Error(errData?.error || "Failed to generate PDF");
  }

  const blob = await response.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  
  const contentDisposition = response.headers.get("content-disposition");
  let filename = isBilling ? `INV-${id}.pdf` : `PUR-${id}.pdf`;
  
  if (contentDisposition) {
    const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
    if (filenameMatch && filenameMatch[1]) {
      filename = filenameMatch[1];
    }
  }

  const link = document.createElement("a");
  link.href = downloadUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  
  document.body.removeChild(link);
  window.URL.revokeObjectURL(downloadUrl);
}
