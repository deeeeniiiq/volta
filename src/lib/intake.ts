// Unidades informadas pelo proprietário. Ficha técnica, inspeção e fotos ainda pendentes.
// Cotação informada: R$ 1 compra 1,22 yuan. Não é cotação de mercado em tempo real.
export const intakeCnyPerBrl = 1.22;

export const intakeReferencePhoto = (year: number) =>
  `/images/apple/macbook-pro-${year === 2018 ? 2018 : year === 2019 ? 2019 : 2017}-cutout.png`;
export const intakeDetailPhoto = intakeReferencePhoto;

const purchases = [
  [2017, 1300, 1900],
  [2017, 1291, 1900],
  [2018, 1500, 2300],
  [2019, 1600, 2350],
  [2017, 1300, 1900],
  [2017, 1300, 1900],
  [2017, 1110, 1900],
  [2017, 1300, 1900],
  [2019, 1500, 2300],
  [2017, 1300, 1900],
  [2017, 1400, 2500, "16″ informado · confirmar modelo"],
] as const;

export const intakeMacbooks = purchases.map((purchase, index) => {
  const [year, yuan, sale] = purchase;
  const modelNote = purchase.length > 3 ? purchase[3] : undefined;
  return {
    sku: `VOLTA-IMPORT-${String(index + 1).padStart(3, "0")}`,
    name: `MacBook Pro ${year}${modelNote ? ` · ${modelNote}` : ""}`,
    year,
    purchaseCnyFen: yuan * 100,
    cnyPerBrl: intakeCnyPerBrl,
    costCents: Math.round(yuan / intakeCnyPerBrl * 100),
    priceCents: sale * 100,
    imageSrc: intakeReferencePhoto(year),
    detailImageSrc: intakeDetailPhoto(year),
  };
});
