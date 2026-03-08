export const formatCurrency = (amount: number | null | undefined): string => {
  if (amount === null || amount === undefined) return "-";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatDate = (date: Date | string | null | undefined): string => {
  if (!date) return "-";
  const dateObj = typeof date === "string" ? new Date(date) : date;
  if (isNaN(dateObj.getTime())) return "-"; // Handle invalid dates
  return dateObj.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export const generateProjectMessage = (project: any, item: any): string => {
  const pName = project?.project_name || item?.short_text || "-";
  const wbs = project?.wbs_id || "-";
  const idProject = project?.identification_project || "-";
  
  const regional = item?.dim_locations?.dim_witels?.dim_regionals?.regional_name || "-";
  const witel = item?.dim_locations?.dim_witels?.witel_name || "-";
  const subDistrict = item?.dim_locations?.sub_district || "-";
  const port = item?.dim_locations?.port_location || "-";
  
  const vendor = item?.dim_vendors?.vendor_name || "-";
  
  const poNum = item?.po_number || "-";
  const poAmount = formatCurrency(Number(item?.po_amount));
  const prNum = item?.pr_number || "-";
  const prAmount = formatCurrency(Number(item?.pr_amount));
  
  const progress = item?.progress_percent ?? 0;
  const statusTomps = item?.status_tomps_stage || "-";
  const statusLapangan = item?.status_lapangan || "-";

  // Using HTML for Telegram
  return `
<b>📋 PROJECT UPDATE</b>

<b>📌 Header</b>
<b>WBS:</b> ${wbs}
<b>Project:</b> ${pName}
<b>ID Project:</b> ${idProject}

<b>📍 Location</b>
<b>Regional:</b> ${regional}
<b>Witel:</b> ${witel}
<b>Sub-district:</b> ${subDistrict}
<b>Port:</b> ${port}

<b>👷 Vendor</b>
<b>Name:</b> ${vendor}

<b>💰 Financials</b>
<b>PO:</b> ${poNum} (${poAmount})
<b>PR:</b> ${prNum} (${prAmount})

<b>📊 Status</b>
<b>Progress:</b> ${progress}%
<b>Tomps:</b> ${statusTomps}
<b>Lapangan:</b> ${statusLapangan}
`.trim();
};
