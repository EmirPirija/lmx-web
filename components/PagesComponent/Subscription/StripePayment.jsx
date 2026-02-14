import React, { useState, useEffect, useCallback } from "react";

import {
  Elements,
  ElementsConsumer,
  CardElement,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { createPaymentIntentApi } from "@/utils/api";
import { toast } from "@/utils/toastBs";
import { t } from "@/utils";
import { Skeleton } from "@/components/ui/skeleton";

const StripePayment = ({
  selectedPackage,
  packageSettings,
  PaymentModalClose,
  setShowStripePayment,
  updateActivePackage,
}) => {
  const [stripePromise, setStripePromise] = useState(null);
  const [clientSecret, setClientSecret] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStripeInstance = async () => {
      if (packageSettings?.Stripe?.api_key) {
        const stripeInstance = await loadStripe(packageSettings.Stripe.api_key);
        setStripePromise(stripeInstance);
      }
    };
    loadStripeInstance();
  }, [packageSettings?.Stripe?.api_key]);

  const handleStripePayment = useCallback(async () => {
    try {
      const res = await createPaymentIntentApi.createIntent({
        package_id: selectedPackage.id,
        payment_method: packageSettings.Stripe.payment_method,
      });
      if (res.data.error === true) {
        toast.error(res.data.message);
        return;
      }
      const paymentIntent =
        res.data.data.payment_intent?.payment_gateway_response;
      const clientSecret = paymentIntent.client_secret;
      setClientSecret(clientSecret);
      setShowStripePayment(true);
    } catch (error) {
      console.error("Error during Stripe payment", error);
      toast.error(t("errorOccurred"));
    } finally {
      setLoading(false);
    }
  }, [
    selectedPackage.id,
    packageSettings?.Stripe?.payment_method,
    setShowStripePayment,
  ]);

  useEffect(() => {
    handleStripePayment();
  }, [handleStripePayment]);

  const PaymentForm = ({ elements, stripe }) => {
    const handleSubmit = async (event) => {
      event.preventDefault();
      const { error, paymentMethod } = await stripe.createPaymentMethod({
        type: "card",
        card: elements.getElement(CardElement),
      });

      if (error) {
        // Handle error here
      } else {
        try {
          const { paymentIntent, error: confirmError } =
            await stripe.confirmCardPayment(clientSecret, {
              payment_method: paymentMethod.id,
            });

          if (confirmError) {
            // Handle confirm error here
          } else {
            if (paymentIntent.status === "succeeded") {
              updateActivePackage();
              PaymentModalClose();
            } else {
              toast.error(t("paymentfail " + paymentIntent.status));
            }
          }
        } catch (error) {
          console.error("Error during payment:", error);
        }
      }
    };

    return (
      <form onSubmit={handleSubmit}>
        <div className="stripe_module">
          <CardElement />
          <button
            className="w-full bg-primary text-white p-2 rounded-md my-4"
            type="submit"
            disabled={!stripePromise}
          >
            {t("pay")}
          </button>
        </div>
      </form>
    );
  };


  return (
    <>
      {loading ? (
        <div className="">
          <div>
            <Skeleton className="mb-2 h-10 w-full rounded-md" />
            <div className="mb-4 flex justify-between">
              <Skeleton className="h-5 w-1/2 rounded-md" />
              <Skeleton className="h-5 w-1/4 rounded-md" />
            </div>
            <Skeleton className="mt-6 h-12 w-full rounded-md" />
          </div>
        </div>
      ) : (
        stripePromise &&
        clientSecret && (
          <div className="card">
            {/* <div className="card-header">{t("payWithStripe")} :</div> */}
            <div className="card-body">
              <Elements stripe={stripePromise}>
                <ElementsConsumer>
                  {({ stripe, elements }) => (
                    <PaymentForm elements={elements} stripe={stripe} />
                  )}
                </ElementsConsumer>
              </Elements>
            </div>
          </div>
        )
      )}
    </>
  );
};

export default StripePayment;
