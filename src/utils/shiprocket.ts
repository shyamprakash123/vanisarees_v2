const SHIPROCKET_BASE_URL = "https://apiv2.shiprocket.in/v1/external";

let authToken: string | null = null;
let tokenExpiry: number = 0;

export interface ShiprocketCredentials {
  email: string;
  password: string;
}

export interface ShiprocketAddress {
  name: string;
  address: string;
  address_2?: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  email?: string;
}

export interface ShiprocketOrderItem {
  name: string;
  sku: string;
  units: number;
  selling_price: number;
  discount?: number;
  tax?: number;
  hsn?: number;
}

export interface ShiprocketOrderPayload {
  id: string;
  order_date: string;
  pickup_location: string;
  channel_id?: string;
  comment?: string;
  billing_customer_name: string;
  billing_last_name?: string;
  billing_address: string;
  billing_address_2?: string;
  billing_city: string;
  billing_pincode: string;
  billing_state: string;
  billing_country: string;
  billing_email: string;
  billing_phone: string;
  shipping_is_billing: boolean;
  shipping_customer_name?: string;
  shipping_last_name?: string;
  shipping_address?: string;
  shipping_address_2?: string;
  shipping_city?: string;
  shipping_pincode?: string;
  shipping_country?: string;
  shipping_state?: string;
  shipping_email?: string;
  shipping_phone?: string;
  order_items: ShiprocketOrderItem[];
  payment_method: string;
  shipping_charges: number;
  giftwrap_charges?: number;
  transaction_charges?: number;
  total_discount?: number;
  sub_total: number;
  length: number;
  breadth: number;
  height: number;
  weight: number;
}

export interface CourierServiceability {
  id: number;
  courier_company_id: number;
  courier_name: string;
  freight_charge: number;
  cod_charges: number;
  cod_multiplier: number;
  other_charges: number;
  estimated_delivery_days: string;
  is_surface: boolean;
  rating: number;
  etd: string;
  base_weight: number;
  weight_cases: any;
  available: boolean;
  error?: string;
  pickup_availability?: string;
  pickup_performance?: number;
  delivery_performance?: number;
  call_before_delivery?: string;
  secure_shipment_disabled?: boolean;
  min_weight?: number;
  qc_courier?: boolean;
}

export interface AWBAssignPayload {
  shipment_id: number;
  courier_id: number;
  awb_code?: string;
  is_return?: number;
}

async function getAuthToken(
  credentials: ShiprocketCredentials
): Promise<string> {
  const now = Date.now();

  if (authToken && tokenExpiry > now) {
    return authToken;
  }

  const response = await fetch(`${SHIPROCKET_BASE_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: credentials.email,
      password: credentials.password,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to authenticate with Shiprocket");
  }

  const data = await response.json();
  authToken = data.token;
  tokenExpiry = now + 10 * 60 * 60 * 1000;

  return authToken;
}

export async function createShiprocketOrder(
  credentials: ShiprocketCredentials,
  payload: ShiprocketOrderPayload
): Promise<any> {
  const token = await getAuthToken(credentials);

  const response = await fetch(`${SHIPROCKET_BASE_URL}/orders/create/adhoc`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to create Shiprocket order");
  }

  return await response.json();
}

export async function checkServiceability(
  credentials: ShiprocketCredentials,
  pickupPostcode: string,
  deliveryPostcode: string,
  codEnabled: boolean = false,
  weight: number = 0.5,
  orderValue?: number
): Promise<CourierServiceability[]> {
  const token = await getAuthToken(credentials);

  const params = new URLSearchParams({
    pickup_postcode: pickupPostcode,
    delivery_postcode: deliveryPostcode,
    cod: codEnabled ? "1" : "0",
    weight: weight.toString(),
  });

  if (orderValue) {
    params.append("declared_value", orderValue.toString());
  }

  const response = await fetch(
    `${SHIPROCKET_BASE_URL}/courier/serviceability/?${params.toString()}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to check serviceability");
  }

  const data = await response.json();
  return data.data?.available_courier_companies || [];
}

export async function assignAWB(
  credentials: ShiprocketCredentials,
  shipmentId: number,
  courierId: number
): Promise<any> {
  const token = await getAuthToken(credentials);

  const response = await fetch(`${SHIPROCKET_BASE_URL}/courier/assign/awb`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      shipment_id: shipmentId,
      courier_id: courierId,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to assign AWB");
  }

  return await response.json();
}

export async function getShipmentDetails(
  credentials: ShiprocketCredentials,
  shipmentId: number
): Promise<any> {
  const token = await getAuthToken(credentials);

  const response = await fetch(
    `${SHIPROCKET_BASE_URL}/shipments/${shipmentId}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to get shipment details");
  }

  return await response.json();
}

export async function generatePickup(
  credentials: ShiprocketCredentials,
  shipmentIds: number[]
): Promise<any> {
  const token = await getAuthToken(credentials);

  const response = await fetch(
    `${SHIPROCKET_BASE_URL}/courier/generate/pickup`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        shipment_id: shipmentIds,
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to generate pickup");
  }

  return await response.json();
}

export async function trackShipment(
  credentials: ShiprocketCredentials,
  awbCode: string
): Promise<any> {
  const token = await getAuthToken(credentials);

  const response = await fetch(
    `${SHIPROCKET_BASE_URL}/courier/track/awb/${awbCode}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to track shipment");
  }

  return await response.json();
}
