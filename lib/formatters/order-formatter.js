var _                        = require('lodash');
var bignum                   = require('bignumber.js');
var ripple                   = require('ripple-lib');
var utils                    = require('../utils');
var validator                = require('../schema-validator');
var config                   = require('../../config/config-loader');
var currency_prioritization  = config.get('currency_prioritization');
var currency_pair_exceptions = config.get('currency_pair_exceptions');

/**
 *  Validate an order in the ripple-rest format. Calls the
 *  callback with (null, true) if it is, responds with
 *  (error, null) otherwise
 */
function orderIsValid(order, callback) {

  if (!order.account) {
    callback(new Error('Missing parameter: account.' +
      ' Must be a valid Ripple Address'));
    return;
  }

  if (validator.validate(order.account, 'RippleAddress').length > 0) {
    callback(new Error('Invalid parameter: account.' +
      ' Must be a valid Ripple Address'));
    return;
  }

  if (!order.hasOwnProperty('is_bid')) {
    callback(new Error('Missing parameter: is_bid.' +
      ' Boolean required to determined whether order is a bid or an ask'));
    return; 
  }

  if (typeof order.is_bid !== 'boolean') {
    callback(new Error('Invalid parameter: is_bid.' +
      ' Boolean required to determined whether order is a bid or an ask'));
    return;
  }

  /* Amounts and exchange rate */

  if (!order.base_amount) {
    callback(new Error('Missing parameter: base_amount.' +
      ' Must be a valid Amount, though "value" can be omitted if exchange_rate is specified'));
    return;
  }

  if (typeof order.base_amount !== 'object' || 
    validator.validate(order.base_amount.currency, 'Currency').length > 0 ||
    ((order.base_amount.currency === 'XRP' && order.base_amount.issuer) ||
      order.base_amount.currency !== 'XRP' && validator.validate(order.base_amount.issuer, 'RippleAddress').length > 0)) {
    callback(new Error('Invalid parameter: base_amount.' +
      ' Must be a valid Amount, though "value" can be omitted if exchange_rate is specified'));
    return;
  }

    if (!order.counter_amount) {
    callback(new Error('Missing parameter: counter_amount.' +
      ' Must be a valid Amount, though "value" can be omitted if exchange_rate is specified'));
    return;
  }

  if (typeof order.counter_amount !== 'object' || 
    validator.validate(order.counter_amount.currency, 'Currency').length > 0 ||
    ((order.counter_amount.currency === 'XRP' && order.counter_amount.issuer) ||
      order.counter_amount.currency !== 'XRP' && validator.validate(order.counter_amount.issuer, 'RippleAddress').length > 0)) {
    callback(new Error('Invalid parameter: counter_amount.' +
      ' Must be a valid Amount, though "value" can be omitted if exchange_rate is specified'));
    return;
  }

  if (order.exchange_rate && validator.validate(order.exchange_rate, 'FloatString').length > 0) {
    callback(new Error('Invalid parameter: exchange_rate.' +
      ' Must be a string representation of a floating point number'));
    return;
  }

  // Either base_amount.value or counter_amount.value can be omitted if exchange_rate is supplied
  // Note that this will accept amount values as strings or numbers
  if ((!order.base_amount.value || 
    validator.validate('' + order.base_amount.value, 'FloatString').length > 0) &&
      validator.validate(order.exchange_rate, 'FloatString').length > 0) {
    callback(new Error('Must supply base_amount and counter_amount complete with values for each.' +
      ' One of the amount value fields may be omitted if exchange_rate is supplied'));
    return;
  }
  if ((!order.counter_amount.value || 
    validator.validate('' + order.counter_amount.value, 'FloatString').length > 0) &&
      validator.validate(order.exchange_rate, 'FloatString').length > 0) {
    callback(new Error('Must supply base_amount and counter_amount complete with values for each.' +
      ' One of the amount value fields may be omitted if exchange_rate is supplied'));
    return;
  }

  /* Optional fields */

  if (order.expiration_timestamp && 
    validator.validate(order.expiration_timestamp, 'Timestamp').length > 0) {
    callback(new Error('Invalid parameter: expiration_timestamp.' +
      ' Must be a valid timestamp'));
    return;
  }

  // ledger_timeout must be a string or numerical representation of a positive integer
  if (order.ledger_timeout && 
    (validator.validate('' + order.ledger_timeout, 'FloatString').length > 0 ||
      parseFloat(order.ledger_timeout) !== parseInt(order.ledger_timeout) ||
      parseInt(order.ledger_timeout) < 0)) {
    callback(new Error('Invalid parameter: ledger_timeout.' +
      ' Must be a positive integer'));
  return;
  }

  if (order.hasOwnProperty('passive') && 
    typeof order.passive !== 'boolean') {
    callback(new Error('Invalid parameter: passive.' +
      ' Must be a boolean'));
  return;
  }

  if (order.hasOwnProperty('immediate_or_cancel') && 
    typeof order.immediate_or_cancel !== 'boolean') {
    callback(new Error('Invalid parameter: immediate_or_cancel.' +
      ' Must be a boolean'));
  return;
  }

  if (order.hasOwnProperty('fill_or_kill') && 
    typeof order.fill_or_kill !== 'boolean') {
    callback(new Error('Invalid parameter: fill_or_kill.' +
      ' Must be a boolean'));
  return;
  }  

  if (order.hasOwnProperty('maximize_buy_or_sell') && 
    typeof order.maximize_buy_or_sell !== 'boolean') {
    callback(new Error('Invalid parameter: maximize_buy_or_sell.' +
      ' Must be a boolean'));
  return;
  }  
  
  // cancel_replace must be a string or numerical representation of a positive integer
  if (order.cancel_replace && 
    (validator.validate('' + order.cancel_replace, 'FloatString').length > 0 ||
      parseFloat(order.cancel_replace) !== parseInt(order.cancel_replace) ||
      parseInt(order.cancel_replace) < 0)) {
    callback(new Error('Invalid parameter: cancel_replace.' +
      ' Must be a positive integer representing the sequence number of an order to replace'));
  return;
  }

  callback(null, true);
}

/**
 *  Parse an order from an OfferCreate, OfferCancel, or Payment transaction.
 *
 *  opts.account is required
 *  opts.sequence is optional
 */
function parseOrderFromTx(tx, opts, callback) {

  if (typeof opts === 'function') {
    callback = opts;
    opts = {};
  }

  // Use currency_prioritization and currency_pair_exceptions from opts
  // if they are supplied, otherwise use values from config defined
  // at the top of the file
  var currency_prioritization, 
    currency_pair_exceptions; 
  if (opts) {
    if (opts.currency_prioritization) {
      currency_prioritization = opts.currency_prioritization;
    } else {
      currency_prioritization = currency_prioritization;
    }
    if (opts.currency_pair_exceptions) {
      currency_pair_exceptions = opts.currency_pair_exceptions;
    } else {
      currency_pair_exceptions = currency_pair_exceptions;
    }
  }

  // "empty" order format
  var order = {
    account: '',
    is_bid: false,
    base_amount: null,
    counter_amount: null,
    exchange_rate: '',
    expiration_timestamp: '',
    ledger_timeout: '',
    passive: false,
    immediate_or_cancel: false,
    fill_or_kill: false,
    maximize_buy_or_sell: false,
    cancel_replace: '',
    sequence: '',
    state: '',
    ledger: '',
    hash: '',
    previous_url: ''
  };

  if (opts.account) {
    order.account = opts.account;
  } else {
    callback(new Error('Must supply opts.account to parse order'));
    return;
  }

  // Find the Offer entry amongst the meta.AffectedNodes
  var offer_entry,
    final_fields,
    action;
  for (var an = 0; an < tx.meta.AffectedNodes.length; an++) {
    var affected_node = tx.meta.AffectedNodes[an],
      node = affected_node.CreatedNode || affected_node.ModifiedNode || affected_node.DeletedNode,
      fields;

    if (node.LedgerEntryType !== 'Offer') {
      continue;
    }

    fields = node.NewFields || node.FinalFields;

    if (fields.Account !== order.account) {
      continue;
    }

    if (opts.sequence && '' + opts.sequence !== '' + fields.Sequence) {
      continue;
    }

    offer_entry = node;
    final_fields = fields;
    if (affected_node.CreatedNode) {
      action = 'created';
    } else if (affected_node.ModifiedNode) {
      action = 'modified';
    } else if (affected_node.DeletedNode) {
      action = 'deleted';
    }
    break;
  }

  // If no offer entry owned by the specified account was found
  // determine whether the account actually had something to do
  // with this transaction. Possible explanations are that the
  // order filled another existing order and was entirely consumed,
  // or the order could have had the immediate_or_cancel or 
  // the fill_or_kill flag set
  if (!offer_entry) {
    
    if (tx.Account !== opts.account ||
      tx.TransactionType !== 'OfferCreate') {

      callback(new Error('Transaction does not contain order matching supplied parameters'));
      return;

    }

    if (tx.Flags & 0x00020000) {
      order.immediate_or_cancel = true;
    }
    if (tx.Flags & 0x00040000) {
      order.fill_or_kill = true;
    }

    final_fields = sumOrdersExercisedByTx(tx);

    final_fields.Sequence = tx.Sequence;
    final_fields.Flags = tx.Flags;

    // Set state based on comparison of final_fields
    // with the tx.TakerPays and tx.TakerGets values
    var gets_value = (typeof tx.TakerGets === 'string' ?
      final_fields.TakerGets :
      final_fields.TakerGets.value);
    var pays_value = (typeof tx.TakerPays === 'string' ?
      final_fields.TakerPays :
      final_fields.TakerPays.value);

    if (bignum(gets_value).equals(0) || 
      bignum(pays_value).equals(0)) {

      order.state = 'failed';

    } else if (typeof tx.TakerGets === 'string' && bignum(tx.TakerGets).greaterThan(gets_value) ||
      typeof tx.TakerPays === 'string' && bignum(tx.TakerPays).greaterThan(pays_value) ||
      typeof tx.TakerGets === 'object' && bignum(tx.TakerGets.value).greaterThan(gets_value) ||
      typeof tx.TakerPays === 'object' && bignum(tx.TakerPays.value).greaterThan(pays_value)) {

      order.state = 'partially_filled';

    } else if (typeof tx.TakerGets === 'string' && bignum(tx.TakerGets).lessThanOrEqualTo(gets_value) ||
      typeof tx.TakerPays === 'string' && bignum(tx.TakerPays).lessThanOrEqualTo(pays_value) ||
      typeof tx.TakerGets === 'object' && bignum(tx.TakerGets.value).lessThanOrEqualTo(gets_value) ||
      typeof tx.TakerPays === 'object' && bignum(tx.TakerPays.value).lessThanOrEqualTo(pays_value)) {
      
      order.state = 'filled';
    
    }

  }

  // Parse exchange_rate from BookDirectory or if the final_fields were invented, 
  // exchange_rate should be TakerPays / Taker Gets
  if (final_fields && final_fields.BookDirectory) {
    order.exchange_rate = '' + ripple.Amount.from_quality(final_fields.BookDirectory).to_json().value;
  } else if (final_fields && final_fields.TakerPays && final_fields.TakerGets) {
    var final_pays_value = (typeof final_fields.TakerPays === 'string' ?
      final_fields.TakerPays :
      final_fields.TakerPays.value);
    var final_gets_value = (typeof final_fields.TakerGets === 'string' ?
      final_fields.TakerGets :
      final_fields.TakerGets.value);
    order.exchange_rate = bignum(bignum(final_pays_value).dividedBy(final_gets_value).toPrecision(15)).toString();
  }

  // Correct for effects of XRP drops in exchange rate
  if (typeof final_fields.TakerGets === 'string') {
    order.exchange_rate = bignum(bignum(order.exchange_rate).times(1000000).toPrecision(15)).toString();
  }
  if (typeof final_fields.TakerPays === 'string') {
    order.exchange_rate = bignum(bignum(order.exchange_rate).dividedBy(1000000).toPrecision(15)).toString();
  }

  // Parse base_amount, counter_amount, is_bid, and exchange rate
  if (baseCurrencyIsTakerGets(final_fields.TakerGets, final_fields.TakerPays, {
    currency_prioritization: currency_prioritization, 
    currency_pair_exceptions: currency_pair_exceptions
  })) {

    order.is_bid = false;
    order.base_amount = formatAmount(final_fields.TakerGets);
    order.counter_amount = formatAmount(final_fields.TakerPays);

    // Note that the exchange_rate does not need to be inverted here
    // because rippled's rate defined as TakerPays / TakerGets is in
    // this case the same as counter_amount / base_amount

  } else {

    order.is_bid = true;
    order.base_amount = formatAmount(final_fields.TakerPays);
    order.counter_amount = formatAmount(final_fields.TakerGets);

    // Flip exchange rate because rippled uses the rate TakerPays / TakerGets
    // which in this case is the inverse of counter_amount / base_amount
    order.exchange_rate = bignum(bignum(1).dividedBy(order.exchange_rate).toPrecision(15)).toString();

  }

  // Format values as strings
  order.base_amount.value = '' + order.base_amount.value;
  order.counter_amount.value = '' + order.counter_amount.value;


  // Parse state if it was not set before
  if (!order.state) {

    if (tx.Account === opts.account &&
      tx.TransactionType === 'OfferCancel') {

      order.state = 'cancelled';

    } else if (action === 'deleted' &&
      offer_entry &&
      offer_entry.PreviousFields &&
      offer_entry.PreviousFields.TakerGets &&
      offer_entry.PreviousFields.TakerPays &&
      (final_fields.TakerPays === '0' || final_fields.TakerPays.value === 0) &&
      (final_fields.TakerGets === '0' || final_fields.TakerGets.value === 0)) {

      order.state = 'filled';

    } else if (offer_entry.PreviousFields &&
      offer_entry.PreviousFields.TakerGets &&
      offer_entry.PreviousFields.TakerPays) {

      order.state = 'partially_filled';
    
    } else {

      order.state = 'active';

    }
  }

  // Parse Flags
  // note that immediate_or_cancel and fill_or_kill are
  // parsed earlier because they will not create a ledger entry
  if (final_fields.Flags & 0x00010000) {
    order.passive = true;
  }
  if (final_fields.Flags & 0x00080000) {
    order.maximize_buy_or_sell = true;
  }

  
  // Add other fields to order object
  order.sequence = '' + final_fields.Sequence;
  order.ledger = '' + tx.ledger_index;
  order.hash = tx.hash;

  callback(null, order);
}

function formatAmount(amount) {

  if (typeof amount === 'string') {
    amount = {
      value: utils.dropsToXrp(amount),
      currency: 'XRP',
      issuer: ''
    };
  }

  amount.currency = amount.currency.toUpperCase();

  return amount;

}


/**
 *  Sum the value deltas of all of the orders exercised by
 *  this transaction to determine how much of the order was
 *  actually filled. This is used in cases where the order
 *  "created" by this transaction did not create a ledger entry.
 *  Returns an object with TakerPays and TakerGets fields
 *  in the same format as rippled (with XRP as a drop string not object)
 */
function sumOrdersExercisedByTx(tx) {

  var totals = {}, 
    final_gets_value = bignum(0), 
    final_pays_value = bignum(0);

  // Look through modified and deleted nodes for ones
  // whose values were changed by this transaction
  for (var an = 0; an < tx.meta.AffectedNodes.length; an++) {
    var affected_node = tx.meta.AffectedNodes[an],
      node = affected_node.ModifiedNode || affected_node.DeletedNode;

    if (!node || 
      node.LedgerEntryType !== 'Offer' ||
      !node.PreviousFields ||
      !node.PreviousFields.TakerPays) {
      continue;
    }

    // If the offer node's TakerPays matches the transaction's TakerGets
    // currency and issuer, calculate the change from the PreviousFields to
    // the FinalFields and add that value to the final_gets_value
    var offer_pays_delta;
    if (typeof node.FinalFields.TakerPays === 'string' && 
      typeof tx.TakerGets === 'string') {

      offer_pays_delta = bignum(node.PreviousFields.TakerPays).minus(node.FinalFields.TakerPays);
    
    } else if (typeof node.FinalFields.TakerPays === 'object' &&
      tx.TakerGets.currency === node.FinalFields.TakerPays.currency &&
      tx.TakerGets.issuer === node.FinalFields.TakerPays.issuer) {
    
      offer_pays_delta = bignum(node.PreviousFields.TakerPays.value).minus(node.FinalFields.TakerPays.value);
    
    }
    if (offer_pays_delta) {
      final_gets_value = final_gets_value.plus(offer_pays_delta);
    }

    // do the same as above for the node's TakerGets
    var offer_gets_delta;
    if (typeof node.FinalFields.TakerGets === 'string' &&
      typeof tx.TakerPays === 'string') {

      offer_gets_delta = bignum(node.PreviousFields.TakerGets).minus(node.FinalFields.TakerGets);

    } else if (typeof node.FinalFields.TakerGets === 'object' &&
      tx.TakerPays.currency === node.FinalFields.TakerGets.currency &&
      tx.TakerPays.issuer === node.FinalFields.TakerGets.issuer) {

      offer_gets_delta = bignum(node.PreviousFields.TakerGets.value).minus(node.FinalFields.TakerGets.value);

    }
    if (offer_gets_delta) {
      final_pays_value = final_pays_value.plus(offer_gets_delta);
    }
  }


  if (typeof tx.TakerGets === 'string') {
    totals.TakerGets = bignum(final_gets_value.toPrecision(15)).toString();
  } else {
    totals.TakerGets = {
      value: bignum(final_gets_value.toPrecision(15)).toString(),
      currency: tx.TakerGets.currency,
      issuer: tx.TakerGets.issuer
    };
  }
  if (typeof tx.TakerPays === 'string') {
    totals.TakerPays = bignum(final_pays_value.toPrecision(15)).toString();
  } else {
    totals.TakerPays = {
      value: bignum(final_pays_value.toPrecision(15)).toString(),
      currency: tx.TakerPays.currency,
      issuer: tx.TakerPays.issuer
    };
  }

  return totals;

}


/**
 *  Determines whether the TakerGets represents the base currency
 *  using the currency_prioritization and currency_pair_exceptions.
 *  Returns true if TakerGets is the "base currency", false otherwise
 *  Note that currency_prioritization and currency_pair_exceptions
 *  can be supplied as opts for testing purposes
 */
function baseCurrencyIsTakerGets(taker_gets, taker_pays, opts) {

  // Use currency_prioritization and currency_pair_exceptions from opts
  // if they are supplied, otherwise use values from config defined
  // at the top of the file
  var currency_prioritization, 
    currency_pair_exceptions; 
  if (opts) {
    if (opts.currency_prioritization) {
      currency_prioritization = opts.currency_prioritization;
    } else {
      currency_prioritization = currency_prioritization;
    }
    if (opts.currency_pair_exceptions) {
      currency_pair_exceptions = opts.currency_pair_exceptions;
    } else {
      currency_pair_exceptions = currency_pair_exceptions;
    }
  }

  // Format amounts
  taker_gets = formatAmount(taker_gets);
  taker_pays = formatAmount(taker_pays);

  // If both currencies are the same look at the issuer
  if (taker_pays.currency === taker_gets.currency) {
    return (taker_gets.issuer <= taker_pays.issuer);
  }

  // Look at exceptions list next
  // Note that exceptions are written as {base}/{counter}
  if (currency_pair_exceptions) {
    
    if (currency_pair_exceptions.indexOf(taker_gets.currency + '/' + taker_pays.currency) !== -1) {
      return true;
    }

    if (currency_pair_exceptions.indexOf(taker_pays.currency + '/' + taker_gets.currency) !== -1) {
      return false;
    }
  }

  // Next use currency_prioritization
  if (currency_prioritization) {

    if (currency_prioritization.indexOf(taker_gets.currency) !== -1 &&
      currency_prioritization.indexOf(taker_pays.currency) !== -1) {

      return (currency_prioritization.indexOf(taker_gets.currency) < 
        currency_prioritization.indexOf(taker_pays.currency));

    } else if (currency_prioritization.indexOf(taker_gets.currency) !== -1) {

      return true;

    } else if (currency_prioritization.indexOf(taker_pays.currency) !== -1) {

      return false;

    }

  }

  // Finally, use lexicographical order
  return taker_gets.currency <= taker_pays.currency;

}

module.exports.baseCurrencyIsTakerGets = baseCurrencyIsTakerGets;
module.exports.parseOrderFromTx        = parseOrderFromTx;
module.exports.sumOrdersExercisedByTx  = sumOrdersExercisedByTx;
module.exports.orderIsValid            = orderIsValid;

