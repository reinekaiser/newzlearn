import { PAYMENT_URL } from "../constants";
import { apiSlice } from "../api/apiSlice";

export const paymentApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    createPaypalOrder: builder.mutation({
      query: (body) => ({
        url: `${PAYMENT_URL}/paypal/create-order`,
        method: "POST",
        body,
      }),
    }),
    completePaypalOrder: builder.mutation({
      query: (body) => ({
        url: `${PAYMENT_URL}/paypal/complete-order`,
        method: "POST",
        body,
      }),
    }),
    // VNPAY
    createVNPayPayment: builder.mutation({
      query: (body) => ({
        url: `${PAYMENT_URL}/vnpay/create`,
        method: "POST",
        body,
      }),
    }),
    // MoMo
    createMoMoPayment: builder.mutation({
      query: (body) => ({
        url: `${PAYMENT_URL}/momo/create`,
        method: "POST",
        body,
      }),
    }),
  }),
});

export const { useCreatePaypalOrderMutation, useCompletePaypalOrderMutation, useCreateVNPayPaymentMutation, useCreateMoMoPaymentMutation } =
  paymentApiSlice;
