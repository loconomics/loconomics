/* Loconomics specific Price, fees and hour-price calculation
    using some static methods and the Price class.
*/
var mu = require('mathUtils');

/* Class Price to calculate a total price based on fees information (fixed and rate)
    and desired decimals for approximations.
*/
function Price(basePrice, fee, roundedDecimals) {
    // fee parameter can be a float number with the feeRate or an object
    // that includes both a feeRate and a fixedFeeAmount
    // Extracting fee values into local vars:
    var feeRate = 0, fixedFeeAmount = 0;
    if (fee['fixedFeeAmount'] || fee['feeRate']) {
        fixedFeeAmount = fee.fixedFeeAmount || .0;
        feeRate = fee.feeRate || .0;
    } else
        feeRate = fee;

    // Calculating:
    // The roundTo with a big fixed decimals is to avoid the
    // decimal error of floating point numbers
    var totalPrice = mu.ceilTo(mu.roundTo(basePrice * (1 + feeRate) + fixedFeeAmount, 12), roundedDecimals);
    // final fee price is calculated as a substraction, but because javascript handles
    // float numbers only, a round operation is required to avoid an irrational number
    var feePrice = mu.roundTo(totalPrice - basePrice, 2);

    // Creating object with full details:
    this.basePrice = basePrice;
    this.feeRate = feeRate;
    this.fixedFeeAmount = fixedFeeAmount;
    this.roundedDecimals = roundedDecimals;
    this.totalPrice = totalPrice;
    this.feePrice = feePrice;
};

/** Calculate and returns the price and relevant data as an object for
time, hourlyRate (with fees) and the hourlyFee.
The time (@duration) is used 'as is', without transformation, maybe you can require
use LC.roundTimeToQuarterHour before pass the duration to this function.
It receives the parameters @hourlyPrice and @surchargePrice as LC.Price objects.
@surchargePrice is optional.
**/
function calculateHourlyPrice(duration, hourlyPrice, surchargePrice) {
    // If there is no surcharge, get zeros
    surchargePrice = surchargePrice || { totalPrice: 0, feePrice: 0, basePrice: 0 };
    // Get hours from rounded duration:
    var hours = mu.roundTo(duration.totalHours(), 2);
    // Calculate final prices
    return {
        totalPrice:     mu.roundTo(hourlyPrice.totalPrice * hours + surchargePrice.totalPrice * hours, 2),
        feePrice:       mu.roundTo(hourlyPrice.feePrice * hours + surchargePrice.feePrice * hours, 2),
        subtotalPrice:  mu.roundTo(hourlyPrice.basePrice * hours + surchargePrice.basePrice * hours, 2),
        durationHours:  hours
    };
}

if (typeof module !== 'undefined' && module.exports)
    module.exports = {
        Price: Price,
        calculateHourlyPrice: calculateHourlyPrice
    };