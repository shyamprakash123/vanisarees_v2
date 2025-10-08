# Shiprocket Integration Guide

This project includes a comprehensive Shiprocket integration that allows sellers and admins to create shipments, check courier serviceability, and assign AWB numbers directly from the frontend.

## Features

### 1. **Create Shiprocket Orders**
- Automatically creates orders in Shiprocket from the platform
- Maps order data to Shiprocket's required format
- Supports both COD and prepaid orders
- Handles order items, addresses, and shipping details

### 2. **Check Courier Serviceability**
- Fetches available courier services for delivery location
- Displays pricing, delivery estimates, and ratings
- Shows both freight charges and COD charges
- Filters only serviceable couriers

### 3. **Assign AWB Numbers**
- Automatically assigns AWB (Air Waybill) numbers
- Updates order tracking information
- Schedules pickup with courier partners
- Updates shipment status in database

### 4. **Real-time Tracking**
- Stores shipment IDs and AWB codes
- Tracks shipment status updates
- Displays tracking information to customers

## Setup Instructions

### Prerequisites
1. Active Shiprocket account
2. Shiprocket API credentials (email and password)
3. At least one pickup location configured in Shiprocket

### Configuration Steps

#### For Sellers:
1. Navigate to `/seller/settings`
2. Click on "Shiprocket" tab
3. Enter your Shiprocket email and password
4. Enter your pickup location name (must match Shiprocket)
5. Click "Save Credentials"

#### For Admins:
Admins can use any configured seller's Shiprocket credentials or set up their own.

## Usage

### Creating Shipments (Seller/Admin Flow)

1. **Navigate to Order Details**
   - Go to `/seller/order/:id` or `/admin/order/:id`
   - Order must be in "confirmed" status

2. **Check Available Couriers**
   - Click "Check Available Couriers"
   - System fetches serviceable couriers for the delivery pincode
   - Displays courier options with:
     - Courier name and rating
     - Freight charges
     - COD charges (if applicable)
     - Estimated delivery days
     - Surface/Air classification

3. **Select Courier & Create Shipment**
   - Click on preferred courier option
   - Click "Create Shipment with Selected Courier"
   - System creates order in Shiprocket
   - Saves shipment ID to database

4. **Assign AWB Number**
   - Click "Assign AWB & Schedule Pickup"
   - System assigns AWB code
   - Schedules pickup automatically
   - Updates order status to "processing"

5. **Shipment Complete**
   - AWB code displayed
   - Order tracking enabled
   - Customer can track shipment

## Database Schema

### Tables Created:

#### `shiprocket_credentials`
Stores Shiprocket API credentials for each seller
- `id`: UUID primary key
- `seller_id`: Reference to sellers table
- `email`: Shiprocket account email
- `password`: Shiprocket account password
- `pickup_location`: Pickup location name
- `active`: Whether credentials are active

#### `shiprocket_shipments`
Stores shipment information
- `id`: UUID primary key
- `order_id`: Reference to orders table
- `shiprocket_order_id`: Shiprocket's order ID
- `shipment_id`: Shiprocket's shipment ID
- `awb_code`: AWB tracking number
- `courier_id`: Selected courier ID
- `courier_name`: Courier company name
- `freight_charge`: Shipping cost
- `cod_charges`: COD charges
- `estimated_delivery_days`: Delivery estimate
- `pickup_scheduled`: Pickup status
- `status`: Shipment status
- `tracking_data`: Tracking information (JSONB)
- `metadata`: Additional data (JSONB)

#### `shiprocket_courier_cache`
Caches courier serviceability results (1 hour TTL)
- `id`: UUID primary key
- `pickup_postcode`: Origin pincode
- `delivery_postcode`: Destination pincode
- `weight`: Package weight
- `cod_enabled`: COD status
- `couriers`: Available couriers (JSONB)
- `expires_at`: Cache expiry time

### Orders Table Updates:
- `shiprocket_order_id`: Shiprocket order ID
- `shiprocket_shipment_id`: Shiprocket shipment ID

## API Functions

### Authentication
```typescript
getAuthToken(credentials: ShiprocketCredentials): Promise<string>
```
Authenticates with Shiprocket API and returns auth token (cached for 10 hours)

### Create Order
```typescript
createShiprocketOrder(
  credentials: ShiprocketCredentials,
  payload: ShiprocketOrderPayload
): Promise<any>
```
Creates an order in Shiprocket

### Check Serviceability
```typescript
checkServiceability(
  credentials: ShiprocketCredentials,
  pickupPostcode: string,
  deliveryPostcode: string,
  codEnabled: boolean,
  weight: number,
  orderValue?: number
): Promise<CourierServiceability[]>
```
Checks available courier services for given route

### Assign AWB
```typescript
assignAWB(
  credentials: ShiprocketCredentials,
  shipmentId: number,
  courierId: number
): Promise<any>
```
Assigns AWB number to shipment

### Generate Pickup
```typescript
generatePickup(
  credentials: ShiprocketCredentials,
  shipmentIds: number[]
): Promise<any>
```
Schedules pickup for shipments

### Track Shipment
```typescript
trackShipment(
  credentials: ShiprocketCredentials,
  awbCode: string
): Promise<any>
```
Gets tracking information for AWB code

## Components

### `ShiprocketManager`
Main component for managing shipment creation flow
- **Location**: `src/components/shiprocket/ShiprocketManager.tsx`
- **Props**:
  - `orderId`: Order ID
  - `order`: Order object
  - `onSuccess`: Callback on successful shipment creation

### `ShiprocketSettings`
Component for managing Shiprocket credentials
- **Location**: `src/components/shiprocket/ShiprocketSettings.tsx`
- **Used in**: Seller Settings page

## Security

### Row Level Security (RLS)
All Shiprocket tables have RLS enabled:

- **Sellers** can only view/edit their own credentials
- **Sellers** can only create/view shipments for their own orders
- **Admins** can view/edit all credentials and shipments
- Courier cache is readable by all authenticated users

### Credential Storage
Credentials are stored in the database. For production:
- Consider encrypting credentials at rest
- Use environment variables for default admin credentials
- Implement credential rotation policies

## Troubleshooting

### Common Issues

1. **"No courier services available"**
   - Check if delivery pincode is serviceable
   - Verify weight and dimensions are correct
   - Ensure COD is enabled if order is COD

2. **"Failed to authenticate with Shiprocket"**
   - Verify email and password are correct
   - Check if Shiprocket account is active
   - Ensure API access is enabled

3. **"Pickup location not found"**
   - Verify pickup location name matches Shiprocket exactly
   - Check if pickup location is active in Shiprocket
   - Ensure pickup address is complete

4. **"Failed to assign AWB"**
   - Check if shipment was created successfully
   - Verify courier is still serviceable
   - Ensure sufficient wallet balance in Shiprocket

### Debug Mode
To enable debug logging, check browser console for detailed error messages.

## Future Enhancements

1. **Bulk Shipment Creation**: Create multiple shipments at once
2. **Label Generation**: Generate and download shipping labels
3. **Manifest Generation**: Create pickup manifests
4. **Return Orders**: Handle return shipment creation
5. **Weight Calculation**: Auto-calculate package weight from products
6. **Dimensional Weight**: Support volumetric weight calculations
7. **Shipment Cancellation**: Cancel shipments before pickup
8. **NDR Management**: Handle Non-Delivery Report cases
9. **Rate Calculator**: Pre-calculate shipping rates during checkout

## Support

For issues or questions:
1. Check Shiprocket API documentation: https://apidocs.shiprocket.in/
2. Verify credentials in `/seller/settings`
3. Check order status and address details
4. Review browser console for error messages

## Notes

- Shiprocket API has rate limits - cache is used to minimize API calls
- Authentication tokens are cached for 10 hours
- Courier serviceability cache expires after 1 hour
- AWB assignment is irreversible - confirm courier selection carefully
- Ensure order addresses are complete and accurate before creating shipment
