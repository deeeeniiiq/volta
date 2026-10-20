export type Availability = "available" | "reserved" | "sold";
export type Publication = "draft" | "published" | "archived";

export type Macbook = {
  id: string;
  createdAt: string;
  sku: string;
  slug: string;
  name: string;
  series: "Air" | "Pro";
  chip: string;
  year: number;
  screen: string;
  ram: number;
  storage: number;
  color: string;
  price: number;
  condition: "Excelente" | "Muito bom" | "Bom";
  batteryHealth: number;
  batteryCycles: number;
  batteryStatus: string;
  inspectedAt: string;
  status: Availability;
  publication: Publication;
  featured: boolean;
  description: string;
  observations: string;
  charger: string;
  warrantyMonths: number;
  images: string[];
  demo?: boolean;
};

export const money = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(value);

export const availabilityLabel: Record<Availability, string> = {
  available: "Disponível",
  reserved: "Reservado",
  sold: "Vendido",
};

export const conditionLabel = (value: string) => value || "Não informado";
