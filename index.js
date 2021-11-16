const express = require("express");
const cors = require("cors");
const { v4: uuid } = require("uuid");
const stripe = require("stripe")(process.env.stripeKey);
const app = express();

const SSLCommerzPayment = require("sslcommerz-lts");
const store_id = process.env.sslStoreId;
const store_passwd = process.env.sslStorePass;
const is_live = false; //true for live, false for sandbox

app.use(cors());
app.use(express.json());
// app.UseCors(options => options.AllowAnyOrigin());
app.use(express.urlencoded({ extended: true }));

const port = process.env.PORT || 5000;

// api's
app.get("/", (req, res) => {
  res.send("Welcome to Stripe and SSL Commerz server");
});

app.post("/create-checkout-session", async (req, res) => {
  const { product } = req.body;

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card", "alipay"],

      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: product.name,
              images: [
                "https://www.filepicker.io/api/file/S5atf80QTb2tZOScHsiW",
              ],
            },
            unit_amount: product.price * 100,
          },

          adjustable_quantity: {
            enabled: true,
            minimum: 1,
            maximum: 5,
          },

          quantity: product.quantity,
        },
      ],

      // phone_number_collection: {
      //   enabled: true,
      // },
      client_reference_id: uuid(),

      shipping_address_collection: {
        allowed_countries: ["BD", "US"],
      },

      mode: "payment",
      success_url: "https://stripe-sslcommerz-paymnet-gateway.netlify.app/",
      cancel_url: "https://stripe-sslcommerz-paymnet-gateway.netlify.app/",
    });

    // res.redirect(303, session.url);
    res.json(session.url);
  } catch (error) {
    res.json({ error: error.message });
  }
});

// api for ssl commerz
//sslcommerz init
app.post("/sslcommerz", (req, res) => {
  const { product } = req.body;

  const data = {
    total_amount: product.price * product.quantity,
    currency: "BDT",
    tran_id: uuid(), // use unique tran_id for each api call
    success_url: "https://frozen-sea-04813.herokuapp.com/success",
    fail_url: "https://frozen-sea-04813.herokuapp.com/fail",
    cancel_url: "https://frozen-sea-04813.herokuapp.com/cancel",
    ipn_url: "https://frozen-sea-04813.herokuapp.com/ipin",
    shipping_method: "Courier",
    product_name: product.name,
    product_category: "Electronic",
    product_profile: "general",
    cus_name: "Customer Name",
    cus_email: "customer@example.com",
    cus_add1: "Dhaka",
    cus_add2: "Dhaka",
    cus_city: "Dhaka",
    cus_state: "Dhaka",
    cus_postcode: "1000",
    cus_country: "Bangladesh",
    cus_phone: "01711111111",
    cus_fax: "01711111111",
    ship_name: "Customer Name",
    ship_add1: "Dhaka",
    ship_add2: "Dhaka",
    ship_city: "Dhaka",
    ship_state: "Dhaka",
    ship_postcode: 1000,
    ship_country: "Bangladesh",
  };
  const sslcz = new SSLCommerzPayment(store_id, store_passwd, is_live);
  sslcz
    .init(data)
    .then((apiResponse) => {
      // Redirect the user to payment gateway
      let GatewayPageURL = apiResponse.GatewayPageURL;

      res.json(GatewayPageURL);
      console.log("Redirecting to: ", GatewayPageURL);
    })
    .catch((error) => {
      res.json(error);
    });
});

app.post("/success", async (req, res) => {
  res.redirect(
    `https://stripe-sslcommerz-paymnet-gateway.netlify.app/success/${req.body.tran_id}`
  );
});

app.post("/fail", (req, res) => {
  res.redirect(
    `https://stripe-sslcommerz-paymnet-gateway.netlify.app/fail/${req.body.tran_id}`
  );
});

app.post("/cancel", (req, res) => {
  res.redirect(
    `https://stripe-sslcommerz-paymnet-gateway.netlify.app/cancel/${req.body.tran_id}`
  );
});

app.post("/ipin", (req, res) => {
  res.redirect(
    `https://stripe-sslcommerz-paymnet-gateway.netlify.app/ipin/${req.body.tran_id}`
  );
});

// app listening api

app.listen(port, () => {
  console.log("Listening to Port = ", port);
});
