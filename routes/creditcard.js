const express = require('express');
const axios = require('axios');
const router = express.Router();

// POST /api/creditcard-bill
router.post('/creditcard-bill', async (req, res) => {
  const { provider_id, mobileNo, pin } = req.body;

  try {
    const response = await axios.post(
      'https://api.aeronpay.in/api/serviceapi-prod/api/utility/ccpayment/creditcard',
      {
        provider_id,
        mobileNo,
        pin,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          // Replace below with your actual AeronPay API token
          Authorization: `Bearer YOUR_AERONPAY_API_KEY`,
        },
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error('AeronPay Error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Credit card bill payment failed.' });
  }
});

module.exports = router;
