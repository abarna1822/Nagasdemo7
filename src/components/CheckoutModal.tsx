import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Banknote,
  Building2,
  CheckCircle2,
  CreditCard,
  ShieldCheck,
  Smartphone,
  Wallet,
  X,
} from 'lucide-react';
import { useNagasStore } from '../store/StoreContext';
import type {
  Order,
  PaymentMethod,
  ShippingDetails,
  ValidationErrors,
} from '../types/commerce';
import {
  calculateDeliveryFee,
  calculateSubtotal,
  formatINR,
  normalizePhone,
  validateCheckoutStep1,
  validatePaymentInput,
} from '../utils/commerce';

interface CheckoutModalProps {
  open: boolean;
  onClose: () => void;
  onTrackOrder: (phone: string) => void;
}

const PAYMENT_OPTIONS: Array<{
  method: PaymentMethod;
  label: string;
  sublabel: string;
  Icon: typeof Smartphone;
}> = [
  {
    method: 'UPI',
    label: 'UPI',
    sublabel: 'GPay, PhonePe, Paytm, BHIM',
    Icon: Smartphone,
  },
  {
    method: 'Card',
    label: 'Credit / Debit Card',
    sublabel: 'Visa, Mastercard, RuPay',
    Icon: CreditCard,
  },
  {
    method: 'Netbanking',
    label: 'Netbanking',
    sublabel: 'All major Indian banks',
    Icon: Building2,
  },
  {
    method: 'Wallets',
    label: 'Wallets',
    sublabel: 'Amazon Pay, PhonePe Wallet',
    Icon: Wallet,
  },
  {
    method: 'Cash on Delivery',
    label: 'Cash on Delivery',
    sublabel: 'Pay cash or UPI on arrival',
    Icon: Banknote,
  },
];

export function CheckoutModal({
  open,
  onClose,
  onTrackOrder,
}: CheckoutModalProps) {
  const { cart, settings, placeOrder } = useNagasStore();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  const [shipping, setShipping] = useState<ShippingDetails>({
    name: '',
    phone: '',
    address: '',
    city: 'Trichy',
    pincode: '',
    deliveryNote: '',
  });
  const [errors, setErrors] = useState<ValidationErrors>({});

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [upiId, setUpiId] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [bankName, setBankName] = useState('SBI');
  const [walletApp, setWalletApp] = useState('Amazon Pay');
  const [paymentErrors, setPaymentErrors] = useState<ValidationErrors>({});
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    if (open && !confirmedOrder) {
      setStep(1);
      setErrors({});
      setPaymentErrors({});
      setSubmitError('');
    }
    if (!open) {
      setConfirmedOrder(null);
      setSubmitError('');
    }
  }, [open, confirmedOrder]);

  if (!open) return null;

  const subtotal = calculateSubtotal(cart);
  const deliveryFee = calculateDeliveryFee(
    subtotal,
    settings.deliveryFee,
    settings.freeDeliveryThreshold
  );
  const total = subtotal + deliveryFee;

  const handleStep1Next = (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateCheckoutStep1(shipping);
    setErrors(validation);
    if (Object.keys(validation).length === 0) {
      setStep(2);
    }
  };

  const handleCompletePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const pErrors = validatePaymentInput(paymentMethod, {
      upiId,
      cardNumber,
      cardExpiry,
      cardCvv,
      bankName,
      walletApp,
    });
    setPaymentErrors(pErrors);
    if (Object.keys(pErrors).length > 0) return;

    setSubmitting(true);
    setSubmitError('');
    try {
      const created = await placeOrder({
        customer: {
          ...shipping,
          phone: normalizePhone(shipping.phone),
        },
        items: [...cart],
        paymentMethod,
      });
      setConfirmedOrder(created);
      setStep(4);
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : 'Unable to confirm order. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Checkout"
      className="fixed inset-0 z-[150] bg-[#1D1714]/65 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-[#FFFDF9] rounded-2xl shadow-2xl border border-[#1D1714]/15 overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-[#1E140E] text-[#FBF8F3] flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest text-[#EE9F2D] font-semibold">
              {step === 4 ? 'Order Confirmed' : `Step ${step} of 3`}
            </p>
            <h2 className="font-display text-xl font-bold">
              {step === 1 && 'Delivery Details'}
              {step === 2 && 'Review Your Order'}
              {step === 3 && 'Payment Gateway'}
              {step === 4 && 'Thank You for Ordering'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close checkout"
            className="p-2 rounded-lg text-[#FBF8F3]/80 hover:bg-white/10 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicator */}
        {step < 4 && (
          <div className="grid grid-cols-3 bg-[#FBF8F3] border-b border-[#1D1714]/10 text-xs font-medium">
            {[
              { n: 1, label: '1. Address' },
              { n: 2, label: '2. Review' },
              { n: 3, label: '3. Payment' },
            ].map((s) => (
              <div
                key={s.n}
                className={`py-2.5 text-center border-b-2 transition-colors ${
                  step === s.n
                    ? 'border-[#4A3222] text-[#4A3222] font-semibold'
                    : step > s.n
                    ? 'border-[#1E8449] text-[#1E8449]'
                    : 'border-transparent text-[#1D1714]/50'
                }`}
              >
                {s.label}
              </div>
            ))}
          </div>
        )}

        <div className="p-6 max-h-[75vh] overflow-y-auto">
          {/* STEP 1: SHIPPING FORM */}
          {step === 1 && (
            <form onSubmit={handleStep1Next} noValidate className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="chk-name"
                    className="block text-xs font-semibold uppercase tracking-wider text-[#1D1714]/75 mb-1.5"
                  >
                    Full Name
                  </label>
                  <input
                    id="chk-name"
                    type="text"
                    value={shipping.name}
                    onChange={(e) =>
                      setShipping({ ...shipping, name: e.target.value })
                    }
                    placeholder="e.g., Priya Sundaram"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#1D1714]/20 bg-white text-sm focus:outline-none focus:border-[#4A3222]"
                  />
                  {errors.name && (
                    <p className="text-xs text-[#B43C2A] mt-1">{errors.name}</p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="chk-phone"
                    className="block text-xs font-semibold uppercase tracking-wider text-[#1D1714]/75 mb-1.5"
                  >
                    Mobile Number (for Order Tracking)
                  </label>
                  <input
                    id="chk-phone"
                    type="tel"
                    value={shipping.phone}
                    onChange={(e) =>
                      setShipping({ ...shipping, phone: e.target.value })
                    }
                    placeholder="10-digit mobile number"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#1D1714]/20 bg-white text-sm tabular-nums focus:outline-none focus:border-[#4A3222]"
                  />
                  {errors.phone && (
                    <p className="text-xs text-[#B43C2A] mt-1">{errors.phone}</p>
                  )}
                </div>
              </div>

              <div>
                <label
                  htmlFor="chk-address"
                  className="block text-xs font-semibold uppercase tracking-wider text-[#1D1714]/75 mb-1.5"
                >
                  Street Address & Landmark
                </label>
                <textarea
                  id="chk-address"
                  rows={2}
                  value={shipping.address}
                  onChange={(e) =>
                    setShipping({ ...shipping, address: e.target.value })
                  }
                  placeholder="Door No., Street Name, Locality (e.g., Edamalaiapatti Pudur)"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#1D1714]/20 bg-white text-sm focus:outline-none focus:border-[#4A3222]"
                />
                {errors.address && (
                  <p className="text-xs text-[#B43C2A] mt-1">{errors.address}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="chk-city"
                    className="block text-xs font-semibold uppercase tracking-wider text-[#1D1714]/75 mb-1.5"
                  >
                    City / Town
                  </label>
                  <input
                    id="chk-city"
                    type="text"
                    value={shipping.city}
                    onChange={(e) =>
                      setShipping({ ...shipping, city: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#1D1714]/20 bg-white text-sm focus:outline-none focus:border-[#4A3222]"
                  />
                  {errors.city && (
                    <p className="text-xs text-[#B43C2A] mt-1">{errors.city}</p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="chk-pincode"
                    className="block text-xs font-semibold uppercase tracking-wider text-[#1D1714]/75 mb-1.5"
                  >
                    Pincode
                  </label>
                  <input
                    id="chk-pincode"
                    type="text"
                    maxLength={6}
                    value={shipping.pincode}
                    onChange={(e) =>
                      setShipping({ ...shipping, pincode: e.target.value })
                    }
                    placeholder="620012"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#1D1714]/20 bg-white text-sm tabular-nums focus:outline-none focus:border-[#4A3222]"
                  />
                  {errors.pincode && (
                    <p className="text-xs text-[#B43C2A] mt-1">{errors.pincode}</p>
                  )}
                </div>
              </div>

              <div>
                <label
                  htmlFor="chk-note"
                  className="block text-xs font-semibold uppercase tracking-wider text-[#1D1714]/75 mb-1.5"
                >
                  Delivery Instructions (Optional)
                </label>
                <input
                  id="chk-note"
                  type="text"
                  value={shipping.deliveryNote ?? ''}
                  onChange={(e) =>
                    setShipping({ ...shipping, deliveryNote: e.target.value })
                  }
                  placeholder="Call on arrival, gift message, preferred time..."
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#1D1714]/20 bg-white text-sm focus:outline-none focus:border-[#4A3222]"
                />
              </div>

              <div className="pt-3 flex justify-end">
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#4A3222] text-[#FFFDF9] text-sm font-medium hover:bg-[#1E140E] transition-colors cursor-pointer"
                >
                  <span>Continue to Review</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: ORDER REVIEW */}
          {step === 2 && (
            <div className="space-y-5">
              <div className="p-4 rounded-xl bg-[#FBF8F3] border border-[#1D1714]/10 flex items-start justify-between gap-4">
                <div className="text-sm">
                  <p className="text-xs uppercase tracking-wider text-[#1D1714]/60 font-semibold">
                    Delivering To
                  </p>
                  <p className="font-semibold text-[#1D1714] mt-1">
                    {shipping.name} · {normalizePhone(shipping.phone)}
                  </p>
                  <p className="text-[#1D1714]/80 mt-0.5">
                    {shipping.address}, {shipping.city} – {shipping.pincode}
                  </p>
                  {shipping.deliveryNote && (
                    <p className="text-xs text-[#4A3222] mt-1">
                      Note: {shipping.deliveryNote}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-xs font-semibold text-[#4A3222] hover:underline shrink-0 cursor-pointer"
                >
                  Edit
                </button>
              </div>

              <div className="divide-y divide-[#1D1714]/10 border border-[#1D1714]/10 rounded-xl bg-white">
                {cart.map((item) => (
                  <div
                    key={`${item.productId}-${item.format}`}
                    className="px-4 py-3 flex items-center justify-between gap-4 text-sm"
                  >
                    <div>
                      <p className="font-semibold text-[#1D1714]">
                        {item.productName}
                      </p>
                      <p className="text-xs text-[#1D1714]/65">
                        {item.format} × {item.quantity}
                      </p>
                    </div>
                    <span className="font-display font-semibold tabular-nums">
                      {formatINR(item.unitPrice * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="space-y-2 text-sm bg-[#FBF8F3]/70 p-4 rounded-xl border border-[#1D1714]/10">
                <div className="flex justify-between">
                  <span>Items Subtotal</span>
                  <span className="tabular-nums font-medium">
                    {formatINR(subtotal)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery Fee</span>
                  <span className="tabular-nums font-medium">
                    {deliveryFee === 0 ? (
                      <span className="text-[#1E8449] font-semibold">FREE</span>
                    ) : (
                      formatINR(deliveryFee)
                    )}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-[#1D1714]/10 text-base font-bold">
                  <span>Payable Total</span>
                  <span className="font-display text-xl text-[#4A3222] tabular-nums">
                    {formatINR(total)}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-[#1D1714]/20 text-sm font-medium text-[#1D1714] hover:bg-[#FBF8F3] cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#4A3222] text-[#FFFDF9] text-sm font-medium hover:bg-[#1E140E] transition-colors cursor-pointer"
                >
                  <span>Continue to Payment</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: PAYMENT GATEWAY */}
          {step === 3 && (
            <form onSubmit={handleCompletePayment} noValidate className="space-y-5">
              <div className="flex items-center justify-between p-4 rounded-xl bg-[#FBF8F3] border border-[#1D1714]/10">
                <div>
                  <p className="text-xs text-[#1D1714]/65">Amount to Pay</p>
                  <p className="font-display text-2xl font-bold text-[#4A3222] tabular-nums">
                    {formatINR(total)}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-[#1E8449] font-medium">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Demo Checkout Gateway</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {PAYMENT_OPTIONS.map(({ method, label, sublabel, Icon }) => {
                  const active = paymentMethod === method;
                  return (
                    <button
                      key={method}
                      type="button"
                      onClick={() => {
                        setPaymentMethod(method);
                        setPaymentErrors({});
                      }}
                      className={`p-3.5 rounded-xl border text-left flex items-center gap-3 transition-colors cursor-pointer ${
                        active
                          ? 'border-[#4A3222] bg-[#4A3222]/5'
                          : 'border-[#1D1714]/15 bg-white hover:border-[#1D1714]/35'
                      }`}
                    >
                      <Icon
                        className={`w-5 h-5 shrink-0 ${
                          active ? 'text-[#4A3222]' : 'text-[#1D1714]/60'
                        }`}
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[#1D1714]">
                          {label}
                        </p>
                        <p className="text-xs text-[#1D1714]/60 truncate">
                          {sublabel}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Method-specific fields */}
              <div className="p-4 rounded-xl bg-white border border-[#1D1714]/15">
                {paymentMethod === 'UPI' && (
                  <div>
                    <label
                      htmlFor="pay-upi"
                      className="block text-xs font-semibold uppercase tracking-wider text-[#1D1714]/75 mb-1.5"
                    >
                      Enter UPI ID
                    </label>
                    <input
                      id="pay-upi"
                      type="text"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      placeholder="yourname@okaxis"
                      className="w-full px-3.5 py-2.5 rounded-lg border border-[#1D1714]/20 text-sm focus:outline-none focus:border-[#4A3222]"
                    />
                    {paymentErrors.upiId && (
                      <p className="text-xs text-[#B43C2A] mt-1">
                        {paymentErrors.upiId}
                      </p>
                    )}
                  </div>
                )}

                {paymentMethod === 'Card' && (
                  <div className="space-y-3">
                    <div>
                      <label
                        htmlFor="pay-card-num"
                        className="block text-xs font-semibold uppercase tracking-wider text-[#1D1714]/75 mb-1"
                      >
                        Card Number
                      </label>
                      <input
                        id="pay-card-num"
                        type="text"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        placeholder="4242 4242 4242 4242"
                        className="w-full px-3.5 py-2.5 rounded-lg border border-[#1D1714]/20 text-sm tabular-nums focus:outline-none focus:border-[#4A3222]"
                      />
                      {paymentErrors.cardNumber && (
                        <p className="text-xs text-[#B43C2A] mt-1">
                          {paymentErrors.cardNumber}
                        </p>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label
                          htmlFor="pay-card-exp"
                          className="block text-xs font-semibold uppercase tracking-wider text-[#1D1714]/75 mb-1"
                        >
                          Expiry (MM/YY)
                        </label>
                        <input
                          id="pay-card-exp"
                          type="text"
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(e.target.value)}
                          placeholder="08/29"
                          className="w-full px-3.5 py-2.5 rounded-lg border border-[#1D1714]/20 text-sm tabular-nums focus:outline-none focus:border-[#4A3222]"
                        />
                        {paymentErrors.cardExpiry && (
                          <p className="text-xs text-[#B43C2A] mt-1">
                            {paymentErrors.cardExpiry}
                          </p>
                        )}
                      </div>
                      <div>
                        <label
                          htmlFor="pay-card-cvv"
                          className="block text-xs font-semibold uppercase tracking-wider text-[#1D1714]/75 mb-1"
                        >
                          CVV
                        </label>
                        <input
                          id="pay-card-cvv"
                          type="password"
                          maxLength={4}
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value)}
                          placeholder="123"
                          className="w-full px-3.5 py-2.5 rounded-lg border border-[#1D1714]/20 text-sm tabular-nums focus:outline-none focus:border-[#4A3222]"
                        />
                        {paymentErrors.cardCvv && (
                          <p className="text-xs text-[#B43C2A] mt-1">
                            {paymentErrors.cardCvv}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {paymentMethod === 'Netbanking' && (
                  <div>
                    <label
                      htmlFor="pay-bank"
                      className="block text-xs font-semibold uppercase tracking-wider text-[#1D1714]/75 mb-1.5"
                    >
                      Select Bank
                    </label>
                    <select
                      id="pay-bank"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-[#1D1714]/20 text-sm bg-white focus:outline-none focus:border-[#4A3222]"
                    >
                      <option value="SBI">State Bank of India</option>
                      <option value="HDFC">HDFC Bank</option>
                      <option value="ICICI">ICICI Bank</option>
                      <option value="Indian Bank">Indian Bank</option>
                      <option value="Axis">Axis Bank</option>
                    </select>
                  </div>
                )}

                {paymentMethod === 'Wallets' && (
                  <div>
                    <label
                      htmlFor="pay-wallet"
                      className="block text-xs font-semibold uppercase tracking-wider text-[#1D1714]/75 mb-1.5"
                    >
                      Choose Digital Wallet
                    </label>
                    <select
                      id="pay-wallet"
                      value={walletApp}
                      onChange={(e) => setWalletApp(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-[#1D1714]/20 text-sm bg-white focus:outline-none focus:border-[#4A3222]"
                    >
                      <option value="Amazon Pay">Amazon Pay</option>
                      <option value="PhonePe Wallet">PhonePe Wallet</option>
                      <option value="Paytm Wallet">Paytm Wallet</option>
                    </select>
                  </div>
                )}

                {paymentMethod === 'Cash on Delivery' && (
                  <p className="text-sm text-[#1D1714]/80">
                    Pay <strong className="tabular-nums">{formatINR(total)}</strong>{' '}
                    via cash or QR scan when our Trichy delivery partner reaches{' '}
                    <strong>{shipping.city}</strong>.
                  </p>
                )}
              </div>

              {submitError && (
                <p className="text-xs font-medium text-[#B43C2A] bg-[#B43C2A]/10 px-3 py-2 rounded-lg">
                  {submitError}
                </p>
              )}

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  disabled={submitting}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-[#1D1714]/20 text-sm font-medium text-[#1D1714] hover:bg-[#FBF8F3] cursor-pointer disabled:opacity-50"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-3 rounded-xl bg-[#1E8449] text-[#FFFDF9] text-sm font-semibold hover:bg-[#166A3A] transition-colors cursor-pointer disabled:opacity-60"
                >
                  {submitting
                    ? 'Confirming Order...'
                    : paymentMethod === 'Cash on Delivery'
                    ? `Place COD Order (${formatINR(total)})`
                    : `Pay ${formatINR(total)} & Confirm`}
                </button>
              </div>
            </form>
          )}

          {/* STEP 4: CONFIRMATION + CELEBRATION */}
          {step === 4 && confirmedOrder && (
            <div className="relative py-6 text-center overflow-hidden">
              {/* Celebration confetti shapes */}
              <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 flex justify-around">
                {['#4A3222', '#D98A1C', '#EE9F2D', '#1E8449', '#4A3222', '#D98A1C'].map(
                  (color, i) => (
                    <span
                      key={i}
                      className="w-2.5 h-2.5 rounded-xs animate-confetti"
                      style={{
                        backgroundColor: color,
                        animationDelay: `${i * 90}ms`,
                      }}
                    />
                  )
                )}
              </div>

              <CheckCircle2 className="w-14 h-14 text-[#1E8449] mx-auto" />
              <p className="font-script text-2xl text-[#D98A1C] mt-2">
                packed fresh in Trichy
              </p>
              <h3 className="font-display text-3xl font-bold text-[#1D1714] mt-1">
                Order {confirmedOrder.id} Confirmed
              </h3>
              <p className="text-sm text-[#1D1714]/75 mt-2 max-w-md mx-auto">
                Thank you, <strong>{confirmedOrder.customer.name}</strong>. We have
                logged your {confirmedOrder.paymentMethod} order for{' '}
                <strong className="tabular-nums">
                  {formatINR(confirmedOrder.total)}
                </strong>
                . Track every stage anytime using phone{' '}
                <strong className="tabular-nums">
                  {confirmedOrder.customer.phone}
                </strong>
                .
              </p>

              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    const phone = confirmedOrder.customer.phone;
                    onClose();
                    onTrackOrder(phone);
                  }}
                  className="px-6 py-3 rounded-xl bg-[#4A3222] text-[#FFFDF9] text-sm font-medium hover:bg-[#1E140E] transition-colors cursor-pointer"
                >
                  Track My Order
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-3 rounded-xl border border-[#1D1714]/20 text-sm font-medium text-[#1D1714] hover:bg-[#FBF8F3] cursor-pointer"
                >
                  Continue Shopping
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
