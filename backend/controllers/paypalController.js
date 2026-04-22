import Course from "../models/course.js";
import Order from "../models/order.js";
import UserBehavior from "../models/userBehavior.js";
import { updateCourseProgress } from "./progressController.js";
const environment = process.env.ENVIRONMENT;
const client_id = process.env.CLIENT_ID;
const client_secret = process.env.CLIENT_SECRET;
const endpoint_url =
  environment === "sandbox"
    ? "https://api-m.sandbox.paypal.com"
    : "https://api-m.paypal.com";

async function get_access_token() {
  const auth = `${client_id}:${client_secret}`;
  const data = "grant_type=client_credentials";
  return fetch(endpoint_url + "/v1/oauth2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(auth).toString("base64")}`,
    },
    body: data,
  })
    .then((res) => res.json())
    .then((json) => {
      return json.access_token;
    })
    .catch(err => console.log(err))
}

function generate_random_uuid() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0,
      v = c == "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export const createOrder = async (req, res) => {
  const amount = req.body.amount;
  get_access_token()
    .then((access_token) => {
      let order_data_json = {
        intent: req.body.intent.toUpperCase(),
        purchase_units: [
          {
            amount: {
              currency_code: "USD",
              value: amount,
            },
          },
        ],
        application_context: {
          return_url: `${process.env.FRONTEND_URL}/course/${req.body.courseAlias}/paypal-success?status=success`,
          cancel_url: `${process.env.FRONTEND_URL}/course/${req.body.courseAlias}/paypal-success?status=cancel`,
        },
      };
      const data = JSON.stringify(order_data_json);
      fetch(endpoint_url + "/v2/checkout/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${access_token}`,
          "Paypal-Request-Id": generate_random_uuid(),
        },
        body: data,
      })
        .then((res) => res.json())
        .then((json) => {
          res.send(json);
        })
        .catch(err => console.log(err))
    })
    .catch((err) => {
      console.log(err);
      res.status(500).send(err);
    });
};

export const completeOrder = async (req, res) => {
  try {
    const course = await Course.findOne({ alias: req.body.courseAlias });
    if (!course) {
      return res.status(404).send({ message: "Course not found" });
    }
    const access_token = await get_access_token();
    const response = await fetch(`${endpoint_url}/v2/checkout/orders/${req.body.order_id}/${req.body.intent}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${access_token}`,
        },
      })
    const json = await response.json();
    if (json.status === "COMPLETED") {
      await Order.create({
        userId: req.user._id,
        courseId: course._id,
        isPaid: true,
        totalPrice: course.price,
        paymentMethod: "PayPal",
      })

      await updateCourseProgress(req.user._id, course._id);
      await UserBehavior.updateOne(
        { user: req.user._id },
        {
          $setOnInsert: {
            user: req.user._id,
          },
        },
        { upsert: true }
      );
      await UserBehavior.updateOne(
        { user: req.user._id, "ordered.course": { $ne: course._id } },
        {
          $push: {
            ordered: {
              course: course._id,
              orderedAt: new Date(),
              price: course.price,
            },
          },
        }
      );      
    }
    res.send(json);
  } catch (err) {
    console.log("Complete Order Error: ", err);
    res.status(500).send(err);
  }
};
