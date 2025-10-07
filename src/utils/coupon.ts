import { supabase } from '../lib/supabase';

export interface Coupon {
  id: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  min_order: number;
  max_discount: number | null;
  max_uses: number | null;
  current_uses: number;
  uses_per_user: number;
  valid_from: string;
  valid_to: string | null;
  active: boolean;
  seller_id: string | null;
}

export interface CouponValidationResult {
  valid: boolean;
  message: string;
  discount?: number;
  coupon?: Coupon;
}

export async function validateCoupon(
  code: string,
  userId: string,
  orderTotal: number,
  sellerId?: string | null
): Promise<CouponValidationResult> {
  try {
    const { data: coupon, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', code.toUpperCase())
      .maybeSingle();

    if (error) throw error;

    if (!coupon) {
      return { valid: false, message: 'Invalid coupon code' };
    }

    if (!coupon.active) {
      return { valid: false, message: 'This coupon is no longer active' };
    }

    const now = new Date();
    const validFrom = new Date(coupon.valid_from);
    if (now < validFrom) {
      return {
        valid: false,
        message: `This coupon will be valid from ${validFrom.toLocaleDateString()}`,
      };
    }

    if (coupon.valid_to) {
      const validTo = new Date(coupon.valid_to);
      if (now > validTo) {
        return {
          valid: false,
          message: 'This coupon has expired',
        };
      }
    }

    if (coupon.seller_id && sellerId && coupon.seller_id !== sellerId) {
      return {
        valid: false,
        message: 'This coupon is not valid for products from this seller',
      };
    }

    if (orderTotal < coupon.min_order) {
      return {
        valid: false,
        message: `Minimum order value of ₹${coupon.min_order} required`,
      };
    }

    if (coupon.max_uses !== null && coupon.current_uses >= coupon.max_uses) {
      return {
        valid: false,
        message: 'This coupon has reached its maximum usage limit',
      };
    }

    const { data: usageData, error: usageError } = await supabase
      .from('coupon_usage')
      .select('id')
      .eq('coupon_id', coupon.id)
      .eq('user_id', userId);

    if (usageError) throw usageError;

    const userUsageCount = usageData?.length || 0;
    if (userUsageCount >= coupon.uses_per_user) {
      return {
        valid: false,
        message: 'You have already used this coupon the maximum number of times',
      };
    }

    let discount = 0;
    if (coupon.type === 'percentage') {
      discount = (orderTotal * coupon.value) / 100;
      if (coupon.max_discount && discount > coupon.max_discount) {
        discount = coupon.max_discount;
      }
    } else {
      discount = coupon.value;
    }

    discount = Math.min(discount, orderTotal);

    return {
      valid: true,
      message: `Coupon applied! You saved ₹${discount.toFixed(2)}`,
      discount: Math.round(discount * 100) / 100,
      coupon,
    };
  } catch (error) {
    console.error('Error validating coupon:', error);
    return {
      valid: false,
      message: 'Failed to validate coupon. Please try again.',
    };
  }
}

export async function applyCoupon(
  couponId: string,
  userId: string,
  orderId: string,
  discountAmount: number
): Promise<boolean> {
  try {
    const { error: usageError } = await supabase
      .from('coupon_usage')
      .insert({
        coupon_id: couponId,
        user_id: userId,
        order_id: orderId,
        discount_amount: discountAmount,
      });

    if (usageError) throw usageError;

    const { error: updateError } = await supabase
      .rpc('increment_coupon_usage', { coupon_id: couponId });

    if (updateError) {
      console.error('Failed to increment coupon usage:', updateError);
    }

    return true;
  } catch (error) {
    console.error('Error applying coupon:', error);
    return false;
  }
}

export function calculateDiscount(
  coupon: Coupon,
  orderTotal: number
): number {
  let discount = 0;

  if (coupon.type === 'percentage') {
    discount = (orderTotal * coupon.value) / 100;
    if (coupon.max_discount && discount > coupon.max_discount) {
      discount = coupon.max_discount;
    }
  } else {
    discount = coupon.value;
  }

  discount = Math.min(discount, orderTotal);
  return Math.round(discount * 100) / 100;
}
