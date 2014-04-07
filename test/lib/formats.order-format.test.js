/*jshint expr: true*/

var expect                = require('chai').expect;
var ripple                = require('ripple-lib');
var clone                 = require('clone');
var order_formatter    = require('../../lib/formatters/order-formatter');

describe('lib/formatters/order-formatter', function(){

  describe('.orderIsValid()', function(){

    var test_order = {
      "account": "rLpq5RcRzA8FU1yUqEPW4xfsdwon7casuM",
      "is_bid": false,
      "base_amount": {
        "value": "100",
        "currency": "XRP",
        "issuer": ""
      },
      "counter_amount": {
        "value": "10",
        "currency": "FAK",
        "issuer": "r4nkJpL9se94ASQut4eXRRtnBPtDpY2PZ6"
      },
      "exchange_rate": "0.1",
      "expiration_timestamp": "2014-04-07T13:21:07.293Z",
      "ledger_timeout": "20",
      "passive": false,
      "immediate_or_cancel": false,
      "fill_or_kill": false,
      "maximize_buy_or_sell": false,
      "cancel_replace": "15"
    };

    it('should respond with an error if account is missing or invalid', function(done){

      var order1 = clone(test_order);
      delete order1.account;
      order_formatter.orderIsValid(order1, function(err, is_valid){
        expect(err).to.exist;
        expect(err.message).to.equal('Missing parameter: account. Must be a valid Ripple Address');
        expect(is_valid).not.to.exist;
      });

      var order2 = clone(test_order);
      order2.account = 'notavalidaddress';
      order_formatter.orderIsValid(order2, function(err, is_valid){
        expect(err).to.exist;
        expect(err.message).to.equal('Invalid parameter: account. Must be a valid Ripple Address');
        expect(is_valid).not.to.exist;
        done()
      });

    });

    it('should respond with an error if is_bid is missing or invalid', function(done){

      var order1 = clone(test_order);
      delete order1.is_bid;
      order_formatter.orderIsValid(order1, function(err, is_valid){
        expect(err).to.exist;
        expect(err.message).to.equal('Missing parameter: is_bid. Boolean required to determined whether order is a bid or an ask');
        expect(is_valid).not.to.exist;
      });

      var order2 = clone(test_order);
      order2.is_bid = 'true';
      order_formatter.orderIsValid(order2, function(err, is_valid){
        expect(err).to.exist;
        expect(err.message).to.equal('Invalid parameter: is_bid. Boolean required to determined whether order is a bid or an ask');
        expect(is_valid).not.to.exist;
        done();
      });

    });

    it('should respond with an error if base_amount is missing or is invalid (note that value can be missing)', function(done){

      var order1 = clone(test_order);
      delete order1.base_amount;
      order_formatter.orderIsValid(order1, function(err, is_valid){
        expect(err).to.exist;
        expect(err.message).to.equal('Missing parameter: base_amount. Must be a valid Amount, though "value" can be omitted if exchange_rate is specified');
        expect(is_valid).not.to.exist;
      });

      var order2 = clone(test_order);
      order2.base_amount = {
        currency: 'USD'
      };
      order_formatter.orderIsValid(order2, function(err, is_valid){
        expect(err).to.exist;
        expect(err.message).to.equal('Invalid parameter: base_amount. Must be a valid Amount, though "value" can be omitted if exchange_rate is specified');
        expect(is_valid).not.to.exist;
      });

      var order3 = clone(test_order);
      order3.base_amount = {
        currency: 'XRP',
        issuer: 'rsomegateway'
      };
      order_formatter.orderIsValid(order3, function(err, is_valid){
        expect(err).to.exist;
        expect(err.message).to.equal('Invalid parameter: base_amount. Must be a valid Amount, though "value" can be omitted if exchange_rate is specified');
        expect(is_valid).not.to.exist;
        done();
      });

    });

    it('should respond with an error if counter_amount is missing or invalid (note that value can be missing)', function(done){

      var order1 = clone(test_order);
      delete order1.counter_amount;
      order_formatter.orderIsValid(order1, function(err, is_valid){
        expect(err).to.exist;
        expect(err.message).to.equal('Missing parameter: counter_amount. Must be a valid Amount, though "value" can be omitted if exchange_rate is specified');
        expect(is_valid).not.to.exist;
      });

      var order2 = clone(test_order);
      order2.counter_amount = {
        currency: 'USD'
      };
      order_formatter.orderIsValid(order2, function(err, is_valid){
        expect(err).to.exist;
        expect(err.message).to.equal('Invalid parameter: counter_amount. Must be a valid Amount, though "value" can be omitted if exchange_rate is specified');
        expect(is_valid).not.to.exist;
      });

      var order3 = clone(test_order);
      order3.counter_amount = {
        currency: 'XRP',
        issuer: 'rsomegateway'
      };
      order_formatter.orderIsValid(order3, function(err, is_valid){
        expect(err).to.exist;
        expect(err.message).to.equal('Invalid parameter: counter_amount. Must be a valid Amount, though "value" can be omitted if exchange_rate is specified');
        expect(is_valid).not.to.exist;
        done();
      });

    });

    it('should respond with an error if exchange_rate is invalid', function(done){

      var order1 = clone(test_order);
      order1.exchange_rate = 'abc';
      order_formatter.orderIsValid(order1, function(err, is_valid){
        expect(err).to.exist;
        expect(err.message).to.equal('Invalid parameter: exchange_rate. Must be a string representation of a floating point number');
        expect(is_valid).not.to.exist;
        done();
      });

    });

    it('should respond with an error if less than two of i) base_amount.value ii) counter_amount.value iii) exchange_rate are specified', function(done){

      var order1 = clone(test_order);
      delete order1.base_amount.value;
      delete order1.exchange_rate;
      order_formatter.orderIsValid(order1, function(err, is_valid){
        expect(err).to.exist;
        expect(err.message).to.equal('Must supply base_amount and counter_amount complete with values for each. One of the amount value fields may be omitted if exchange_rate is supplied');
        expect(is_valid).not.to.exist;
      });

      var order2 = clone(test_order);
      delete order2.counter_amount.value;
      delete order2.exchange_rate;
      order_formatter.orderIsValid(order2, function(err, is_valid){
        expect(err).to.exist;
        expect(err.message).to.equal('Must supply base_amount and counter_amount complete with values for each. One of the amount value fields may be omitted if exchange_rate is supplied');
        expect(is_valid).not.to.exist;
        done();
      });

    });

    it('should respond with an error if expiration_timestamp is not a valid timestamp', function(done){

      var order1 = clone(test_order);
      order1.expiration_timestamp = 'abc';
      order_formatter.orderIsValid(order1, function(err, is_valid){
        expect(err).to.exist;
        expect(err.message).to.equal('Invalid parameter: expiration_timestamp. Must be a valid timestamp');
        expect(is_valid).not.to.exist;
      });

      var order2 = clone(test_order);
      order2.expiration_timestamp = '1396876559';
      order_formatter.orderIsValid(order2, function(err, is_valid){
        expect(err).to.exist;
        expect(err.message).to.equal('Invalid parameter: expiration_timestamp. Must be a valid timestamp');
        expect(is_valid).not.to.exist;
        done();
      });

    });

    it('should respond with an error if ledger_timeout is not a natural number', function(done){

      var order1 = clone(test_order);
      order1.ledger_timeout = 'abc';
      order_formatter.orderIsValid(order1, function(err, is_valid){
        expect(err).to.exist;
        expect(err.message).to.equal('Invalid parameter: ledger_timeout. Must be a positive integer');
        expect(is_valid).not.to.exist;
      });

      var order2 = clone(test_order);
      order2.ledger_timeout = '10.5';
      order_formatter.orderIsValid(order2, function(err, is_valid){
        expect(err).to.exist;
        expect(err.message).to.equal('Invalid parameter: ledger_timeout. Must be a positive integer');
        expect(is_valid).not.to.exist;
      });

      var order3 = clone(test_order);
      order3.ledger_timeout = '-10';
      order_formatter.orderIsValid(order3, function(err, is_valid){
        expect(err).to.exist;
        expect(err.message).to.equal('Invalid parameter: ledger_timeout. Must be a positive integer');
        expect(is_valid).not.to.exist;
        done();
      });

    });

    it('should respond with an error if passive is invalid', function(done){

      var order1 = clone(test_order);
      order1.passive = 'true';
      order_formatter.orderIsValid(order1, function(err, is_valid){
        expect(err).to.exist;
        expect(err.message).to.equal('Invalid parameter: passive. Must be a boolean');
        expect(is_valid).not.to.exist;
        done();
      });      

    });

    it('should respond with an error if immediate_or_cancel is invalid', function(done){

      var order1 = clone(test_order);
      order1.immediate_or_cancel = 'true';
      order_formatter.orderIsValid(order1, function(err, is_valid){
        expect(err).to.exist;
        expect(err.message).to.equal('Invalid parameter: immediate_or_cancel. Must be a boolean');
        expect(is_valid).not.to.exist;
        done();
      });      

    });

    it('should respond with an error if fill_or_kill is invalid', function(done){

      var order1 = clone(test_order);
      order1.fill_or_kill = 'true';
      order_formatter.orderIsValid(order1, function(err, is_valid){
        expect(err).to.exist;
        expect(err.message).to.equal('Invalid parameter: fill_or_kill. Must be a boolean');
        expect(is_valid).not.to.exist;
        done();
      });      

    });

    it('should respond with an error if maximize_buy_or_sell is invalid', function(done){

      var order1 = clone(test_order);
      order1.maximize_buy_or_sell = 'true';
      order_formatter.orderIsValid(order1, function(err, is_valid){
        expect(err).to.exist;
        expect(err.message).to.equal('Invalid parameter: maximize_buy_or_sell. Must be a boolean');
        expect(is_valid).not.to.exist;
        done();
      });      

    });

    it('should respond with an error if cancel_replace is not a natural number', function(){

      var order1 = clone(test_order);
      order1.cancel_replace = 'abc';
      order_formatter.orderIsValid(order1, function(err, is_valid){
        expect(err).to.exist;
        expect(err.message).to.equal('Invalid parameter: cancel_replace. Must be a positive integer representing the sequence number of an order to replace');
        expect(is_valid).not.to.exist;
      });  

      var order2 = clone(test_order);
      order2.cancel_replace = '10.5';
      order_formatter.orderIsValid(order2, function(err, is_valid){
        expect(err).to.exist;
        expect(err.message).to.equal('Invalid parameter: cancel_replace. Must be a positive integer representing the sequence number of an order to replace');
        expect(is_valid).not.to.exist;
      });  

      var order3 = clone(test_order);
      order3.cancel_replace = '-10';
      order_formatter.orderIsValid(order3, function(err, is_valid){
        expect(err).to.exist;
        expect(err.message).to.equal('Invalid parameter: cancel_replace. Must be a positive integer representing the sequence number of an order to replace');
        expect(is_valid).not.to.exist;
      });  

    });

    it('should properly validate a valid order', function(){

      order_formatter.orderIsValid(test_order, function(err, is_valid){
        expect(err).not.to.exist;
        expect(is_valid).to.be.true;
      });

    });

    it('should properly validate an order with one amount value missing but exchange_rate supplied', function(){

      var order1 = clone(test_order);
      delete order1.base_amount.value;
      order1.exchange_rate = '0.10';
      order_formatter.orderIsValid(order1, function(err, is_valid){
        expect(err).not.to.exist;
        expect(is_valid).to.be.true;
      });

      var order2 = clone(test_order);
      delete order2.counter_amount.value;
      order2.exchange_rate = '10.0';
      order_formatter.orderIsValid(order2, function(err, is_valid){
        expect(err).not.to.exist;
        expect(is_valid).to.be.true;
      });

    });

    it('should accept amount values as strings or numbers', function(done){

      var order1 = clone(test_order);
      order1.base_amount.value = parseFloat(order1.base_amount.value);
      order_formatter.orderIsValid(order1, function(err, is_valid){
        expect(err).not.to.exist;
        expect(is_valid).to.be.true;
      });

      var order2 = clone(test_order);
      order2.counter_amount.value = parseFloat(order2.counter_amount.value);
      order_formatter.orderIsValid(order2, function(err, is_valid){
        expect(err).not.to.exist;
        expect(is_valid).to.be.true;
        done();
      });

    });

    it('should accept the ledger_timeout as a string or number', function(done){

      var order1 = clone(test_order);
      order1.ledger_timeout = '20';
      order_formatter.orderIsValid(order1, function(err, is_valid){
        expect(err).not.to.exist;
        expect(is_valid).to.be.true;
      });

      var order2 = clone(test_order);
      order2.ledger_timeout = 20;
      order_formatter.orderIsValid(order2, function(err, is_valid){
        expect(err).not.to.exist;
        expect(is_valid).to.be.true;
        done();
      });

    });

  });

  describe('.parseOrderFromTx()', function(){

    it('should respond with an error if no account is supplied in the opts', function(){

      order_formatter.parseOrderFromTx({}, function(err, order){
        expect(err).to.exist;
        expect(err.message).to.equal('Must supply opts.account to parse order');
        expect(order).not.to.exist;
      });

    });

    it('should correctly parse XRP amounts and exchange_rates', function(){

      order_formatter.parseOrderFromTx({
        meta: {
          AffectedNodes: [{
            ModifiedNode: {
              LedgerEntryType: 'Offer',
              FinalFields: {
                Account: 'rLpq5RcRzA8FU1yUqEPW4xfsdwon7casuM',
                BookDirectory: 'CF8D13399C6ED20BA82740CFA78E928DC8D498255249BA634E038D7EA4C68000',
                TakerGets: '1000000',
                TakerPays: {
                  value: 0.1,
                  currency: 'USD',
                  issuer: 'r...'
                }
              }
            }
          }]
        }
      }, {
        account: 'rLpq5RcRzA8FU1yUqEPW4xfsdwon7casuM',
        currency_prioritization: [ 'XRP', 'USD' ]
      }, function(err, order){
        expect(err).not.to.exist;

        expect(order.is_bid).to.be.false;
        expect(order.base_amount.value).to.equal('1');
        expect(order.base_amount.currency).to.equal('XRP');
        expect(order.counter_amount.currency).to.equal('USD');
        expect(order.exchange_rate).to.equal('0.1');
      });

      order_formatter.parseOrderFromTx({
        meta: {
          AffectedNodes: [{
            ModifiedNode: {
              LedgerEntryType: 'Offer',
              FinalFields: {
                Account: 'rNw4ozCG514KEjPs5cDrqEcdsi31Jtfm5r',
                BookDirectory: '3314E812CD309A7DE88E3BEDED6127FCB050AAC661A0719E5D038D7EA4C68000',
                TakerGets: {
                  value: 1,
                  currency: 'FAK',
                  issuer: 'rLpq5RcRzA8FU1yUqEPW4xfsdwon7casuM'
                },
                TakerPays: '100000000'
              }
            }
          }]
        }
      }, {
        account: 'rNw4ozCG514KEjPs5cDrqEcdsi31Jtfm5r',
        currency_prioritization: [ 'XRP', 'USD' ]
      }, function(err, order){
        expect(err).not.to.exist;

        expect(order.is_bid).to.be.true;
        expect(order.base_amount.value).to.equal('100');
        expect(order.base_amount.currency).to.equal('XRP');
        expect(order.counter_amount.currency).to.equal('FAK');
        expect(order.exchange_rate).to.equal('0.01');
      });

    });

    it('should parse amounts from the final fields in partially filled orders', function(){

      order_formatter.parseOrderFromTx({
        meta: {
          AffectedNodes: [{
            ModifiedNode: {
              LedgerEntryType: 'Offer',
              PreviousFields: {
                TakerGets: {
                  value: 2,
                  currency: 'FAK',
                  issuer: 'rLpq5RcRzA8FU1yUqEPW4xfsdwon7casuM'
                },
                TakerPays: {
                  value: 1,
                  currency: 'USD',
                  issuer: 'rLpq5RcRzA8FU1yUqEPW4xfsdwon7casuM'
                }
              },
              FinalFields: {
                Account: 'rNw4ozCG514KEjPs5cDrqEcdsi31Jtfm5r',
                BookDirectory: '2BD15E244142FBC8FC0E8C167D2A098D4A120E257523DE155411C37937E08000',
                TakerGets: {
                  value: 1,
                  currency: 'FAK',
                  issuer: 'rLpq5RcRzA8FU1yUqEPW4xfsdwon7casuM'
                },
                TakerPays: {
                  value: 0.5,
                  currency: 'USD',
                  issuer: 'rLpq5RcRzA8FU1yUqEPW4xfsdwon7casuM'
                }
              }
            }
          }]
        }
      }, {
        account: 'rNw4ozCG514KEjPs5cDrqEcdsi31Jtfm5r',
        currency_prioritization: [ 'USD' ]
      }, function(err, order){
        expect(err).not.to.exist;

        expect(order.is_bid).to.be.true;
        expect(order.base_amount.value).to.equal('0.5');
        expect(order.base_amount.currency).to.equal('USD');
        expect(order.counter_amount.currency).to.equal('FAK');
        expect(order.exchange_rate).to.equal('2');
      });

    });

    it('should parse the correct state from a partially filled order', function(){
      order_formatter.parseOrderFromTx({
        meta: {
          AffectedNodes: [{
            ModifiedNode: {
              LedgerEntryType: 'Offer',
              PreviousFields: {
                TakerGets: {
                  value: 2,
                  currency: 'FAK',
                  issuer: 'rLpq5RcRzA8FU1yUqEPW4xfsdwon7casuM'
                },
                TakerPays: {
                  value: 1,
                  currency: 'USD',
                  issuer: 'rLpq5RcRzA8FU1yUqEPW4xfsdwon7casuM'
                }
              },
              FinalFields: {
                Account: 'rNw4ozCG514KEjPs5cDrqEcdsi31Jtfm5r',
                BookDirectory: '2BD15E244142FBC8FC0E8C167D2A098D4A120E257523DE155411C37937E08000',
                TakerGets: {
                  value: 1,
                  currency: 'FAK',
                  issuer: 'rLpq5RcRzA8FU1yUqEPW4xfsdwon7casuM'
                },
                TakerPays: {
                  value: 0.5,
                  currency: 'USD',
                  issuer: 'rLpq5RcRzA8FU1yUqEPW4xfsdwon7casuM'
                }
              }
            }
          }]
        }
      }, {
        account: 'rNw4ozCG514KEjPs5cDrqEcdsi31Jtfm5r'
      }, function(err, order){
        expect(err).not.to.exist;
        expect(order.state).to.equal('partially_filled');
      });
    });

    // it('should parse the correct state from an expired order', function(){

      // Need last ledger validation to be able to know
      // if order has passed expiration

    // });

    it('should parse the correct state from a cancelled order', function(){

      // OfferCancel transaction
      var tx_str = '{"Account":"rKXCummUHnenhYudNb9UoJ4mGBR75vFcgz","Fee":"12","Flags":0,"OfferSequence":219,"Sequence":220,"SigningPubKey":"025B32A54BFA33FB781581F49B235C0E2820C929FF41E677ADA5D3E53CFBA46332","TransactionType":"OfferCancel","TxnSignature":"3046022100C74F896BADFFB8AB07593E231C49D6C4FD2BAE1924C71F76B9B55C082C5C6DE0022100AB74993944FE3B368D5194664D5E1BCFE3346CFE2040FB41A86743DF61DDF2EF","hash":"CF57F31D675879789BC02E6C65FCAFE9186752ED40884F2903621F2C3F6F6E1C","inLedger":5998104,"ledger_index":5998104,"meta":{"AffectedNodes":[{"DeletedNode":{"FinalFields":{"Account":"rKXCummUHnenhYudNb9UoJ4mGBR75vFcgz","BookDirectory":"2BD15E244142FBC8FC0E8C167D2A098D4A120E257523DE155411C37937E08000","BookNode":"0000000000000000","Flags":131072,"OwnerNode":"0000000000000000","PreviousTxnID":"6351514DBA2464E9B7FF646DD7D43D7488AE180D4EA42658A45BCF26FD8F6DF8","PreviousTxnLgrSeq":5997914,"Sequence":219,"TakerGets":{"currency":"FAK","issuer":"rLpq5RcRzA8FU1yUqEPW4xfsdwon7casuM","value":"2"},"TakerPays":{"currency":"USD","issuer":"rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B","value":"1"}},"LedgerEntryType":"Offer","LedgerIndex":"1EA4C90D13E156AFDF1A00405080287A66850B3DB74C3D3AEF09CEA262B3C93E"}},{"DeletedNode":{"FinalFields":{"ExchangeRate":"5411C37937E08000","Flags":0,"RootIndex":"2BD15E244142FBC8FC0E8C167D2A098D4A120E257523DE155411C37937E08000","TakerGetsCurrency":"00000000000000000000000046414B0000000000","TakerGetsIssuer":"D0C3786E1EF7ED5A55715427796C37F6C1953D3F","TakerPaysCurrency":"0000000000000000000000005553440000000000","TakerPaysIssuer":"0A20B3C85F482532A9578DBB3950B85CA06594D1"},"LedgerEntryType":"DirectoryNode","LedgerIndex":"2BD15E244142FBC8FC0E8C167D2A098D4A120E257523DE155411C37937E08000"}},{"ModifiedNode":{"FinalFields":{"Account":"rKXCummUHnenhYudNb9UoJ4mGBR75vFcgz","Balance":"262268050","Flags":0,"OwnerCount":4,"Sequence":221},"LedgerEntryType":"AccountRoot","LedgerIndex":"58D2E252AE8842B950C960B6BC7A3319762F1C66E3C35985A3B160479EFEDF23","PreviousFields":{"Balance":"262268062","OwnerCount":5,"Sequence":220},"PreviousTxnID":"6351514DBA2464E9B7FF646DD7D43D7488AE180D4EA42658A45BCF26FD8F6DF8","PreviousTxnLgrSeq":5997914}},{"ModifiedNode":{"FinalFields":{"Flags":0,"Owner":"rKXCummUHnenhYudNb9UoJ4mGBR75vFcgz","RootIndex":"F655EAF4786194E0F98C74517D2444AC6932FDAD9EBB69F06394330298A52C15"},"LedgerEntryType":"DirectoryNode","LedgerIndex":"F655EAF4786194E0F98C74517D2444AC6932FDAD9EBB69F06394330298A52C15"}}],"TransactionIndex":3,"TransactionResult":"tesSUCCESS"},"validated":true}';
      var tx = JSON.parse(tx_str);

      order_formatter.parseOrderFromTx(tx, {
        account: 'rKXCummUHnenhYudNb9UoJ4mGBR75vFcgz'
      }, function(err, order){
        expect(err).not.to.exist;
        expect(order.state).to.equal('cancelled');
      });

    });

    it('should parse the state as active from an order that does not have any of the other states', function(){

      order_formatter.parseOrderFromTx({
        meta: {
          AffectedNodes: [{
            ModifiedNode: {
              LedgerEntryType: 'Offer',
              FinalFields: {
                Account: 'rKXCummUHnenhYudNb9UoJ4mGBR75vFcgz',
                BookDirectory: '2BD15E244142FBC8FC0E8C167D2A098D4A120E257523DE155411C37937E08000',
                TakerPays: {
                  value: 1,
                  currency: 'USD',
                  issuer: 'r...'
                },
                TakerGets: {
                  value: 2,
                  currency: 'XRP',
                  issuer: ''
                }
              }
            }
          }]
        }
      }, {
        account: 'rKXCummUHnenhYudNb9UoJ4mGBR75vFcgz'
      }, function(err, order){
        expect(err).not.to.exist;
        expect(order.state).to.equal('active');
      });

    });

    it('should properly parse multiple sets of flags from an offer ledger entry', function(){

      order_formatter.parseOrderFromTx({
        meta: {
          AffectedNodes: [{
            ModifiedNode: {
              LedgerEntryType: 'Offer',
              FinalFields: {
                Account: 'rKXCummUHnenhYudNb9UoJ4mGBR75vFcgz',
                Flags: parseInt(0x00010000 | 0x00080000),
                BookDirectory: '2BD15E244142FBC8FC0E8C167D2A098D4A120E257523DE155411C37937E08000',
                TakerPays: '1000',
                TakerGets: {
                  value: 10,
                  currency: 'FAK',
                  issuer: 'r...'
                }
              }
            }
          }]
        }
      }, {
        account: 'rKXCummUHnenhYudNb9UoJ4mGBR75vFcgz',
        currency_prioritization: [ 'XRP' ]
      }, function(err, order){
        expect(err).not.to.exist;
        expect(order.passive).to.be.true;
        expect(order.immediate_or_cancel).to.be.false;
        expect(order.fill_or_kill).to.be.false;
        expect(order.maximize_buy_or_sell).to.be.true;
      });

    });

    it('should properly parse the flags when no ledger entry was created', function(){

      order_formatter.parseOrderFromTx({
        Account: 'rKXCummUHnenhYudNb9UoJ4mGBR75vFcgz',
        TransactionType: 'OfferCreate',
        TakerPays: '10',
        TakerGets: {
          value: '1',
          currency: 'FAK',
          issuer: 'r...'
        },
        Flags: parseInt(0x00020000),
        meta: {
          AffectedNodes: []
        }
      }, {
        account: 'rKXCummUHnenhYudNb9UoJ4mGBR75vFcgz'
      }, function(err, order){
        expect(err).not.to.exist;
        expect(order.passive).to.be.false;
        expect(order.immediate_or_cancel).to.be.true;
        expect(order.fill_or_kill).to.be.false;
        expect(order.maximize_buy_or_sell).to.be.false;
      });

      order_formatter.parseOrderFromTx({
        Account: 'rKXCummUHnenhYudNb9UoJ4mGBR75vFcgz',
        TransactionType: 'OfferCreate',
        Flags: parseInt(0x00020000 | 0x00040000),
        TakerPays: '10',
        TakerGets: {
          value: '1',
          currency: 'FAK',
          issuer: 'r...'
        },
        meta: {
          AffectedNodes: []
        }
      }, {
        account: 'rKXCummUHnenhYudNb9UoJ4mGBR75vFcgz'
      }, function(err, order){
        expect(err).not.to.exist;
        expect(order.passive).to.be.false;
        expect(order.immediate_or_cancel).to.be.true;
        expect(order.fill_or_kill).to.be.true;
        expect(order.maximize_buy_or_sell).to.be.false;
      });

      order_formatter.parseOrderFromTx({
        Account: 'rKXCummUHnenhYudNb9UoJ4mGBR75vFcgz',
        TransactionType: 'OfferCreate',
        Flags: parseInt(0x00080000 | 0x00020000 | 0x00040000),
        TakerPays: '10',
        TakerGets: {
          value: '1',
          currency: 'FAK',
          issuer: 'r...'
        },
        meta: {
          AffectedNodes: []
        }
      }, {
        account: 'rKXCummUHnenhYudNb9UoJ4mGBR75vFcgz'
      }, function(err, order){
        expect(err).not.to.exist;
        expect(order.passive).to.be.false;
        expect(order.immediate_or_cancel).to.be.true;
        expect(order.fill_or_kill).to.be.true;
        expect(order.maximize_buy_or_sell).to.be.true;
      });

    });

    it('should parse an order that filled an existing order, even if the former did not create a ledger entry', function(){

      // This tx did not create a ledger entry for the order placed
      var tx_str = '{"Account":"rKXCummUHnenhYudNb9UoJ4mGBR75vFcgz","Fee":"12","Flags":0,"Sequence":218,"SigningPubKey":"025B32A54BFA33FB781581F49B235C0E2820C929FF41E677ADA5D3E53CFBA46332","TakerGets":"10000000","TakerPays":{"currency":"FAK","issuer":"rLpq5RcRzA8FU1yUqEPW4xfsdwon7casuM","value":"0.1"},"TransactionType":"OfferCreate","TxnSignature":"3046022100E509E9FB8B45AEEFF42061FFC596B091A6E68FB4AC4D2CC5E8AF5F65F6008168022100BD3B637C0C5B4CD5C840B775FB0051A5F7B4A5435AC336883EDECA68ADD067C4","hash":"78B09A606C0CE5D1E2C3C889410CB8E8A5D20C62B2A0D487DFFBECE82A791822","inLedger":5997476,"ledger_index":5997476,"meta":{"AffectedNodes":[{"ModifiedNode":{"FinalFields":{"Account":"rKXCummUHnenhYudNb9UoJ4mGBR75vFcgz","Balance":"262268074","Flags":0,"OwnerCount":4,"Sequence":219},"LedgerEntryType":"AccountRoot","LedgerIndex":"58D2E252AE8842B950C960B6BC7A3319762F1C66E3C35985A3B160479EFEDF23","PreviousFields":{"Balance":"272268086","OwnerCount":3,"Sequence":218},"PreviousTxnID":"597A422E149F72A3329728A14EB3D95DC084D88AA784BE3697918E878BB7BD47","PreviousTxnLgrSeq":5852778}},{"ModifiedNode":{"FinalFields":{"Flags":0,"Owner":"rLpq5RcRzA8FU1yUqEPW4xfsdwon7casuM","RootIndex":"5E9C0F9141C887905682A9826722222AE89C8028A31B19F35835A26169D89F7C"},"LedgerEntryType":"DirectoryNode","LedgerIndex":"5E9C0F9141C887905682A9826722222AE89C8028A31B19F35835A26169D89F7C"}},{"CreatedNode":{"LedgerEntryType":"RippleState","LedgerIndex":"80F8F712C44F9887E08AB36FB63D24C3AAAFBCFFA398500F72535AD1A5CDBC09","NewFields":{"Balance":{"currency":"FAK","issuer":"rrrrrrrrrrrrrrrrrrrrBZbvji","value":"0.1"},"Flags":65536,"HighLimit":{"currency":"FAK","issuer":"rLpq5RcRzA8FU1yUqEPW4xfsdwon7casuM","value":"0"},"LowLimit":{"currency":"FAK","issuer":"rKXCummUHnenhYudNb9UoJ4mGBR75vFcgz","value":"0"}}}},{"ModifiedNode":{"FinalFields":{"Balance":{"currency":"FAK","issuer":"rrrrrrrrrrrrrrrrrrrrBZbvji","value":"9.9"},"Flags":1114112,"HighLimit":{"currency":"FAK","issuer":"rLpq5RcRzA8FU1yUqEPW4xfsdwon7casuM","value":"0"},"HighNode":"0000000000000000","LowLimit":{"currency":"FAK","issuer":"rNw4ozCG514KEjPs5cDrqEcdsi31Jtfm5r","value":"100"},"LowNode":"0000000000000000"},"LedgerEntryType":"RippleState","LedgerIndex":"DCFC152C9AA0260A8DABC7CBFB1F8078E614283A18D4599D24A560F9C6BC947F","PreviousFields":{"Balance":{"currency":"FAK","issuer":"rrrrrrrrrrrrrrrrrrrrBZbvji","value":"10"}},"PreviousTxnID":"93765BFC8971B7670ABFC0D2C8EA6715E979E1E1881951CBDBEFF6EED33E7286","PreviousTxnLgrSeq":5373092}},{"ModifiedNode":{"FinalFields":{"Account":"rNw4ozCG514KEjPs5cDrqEcdsi31Jtfm5r","BookDirectory":"3314E812CD309A7DE88E3BEDED6127FCB050AAC661A0719E5D038D7EA4C68000","BookNode":"0000000000000000","Flags":131072,"OwnerNode":"0000000000000000","Sequence":127,"TakerGets":{"currency":"FAK","issuer":"rLpq5RcRzA8FU1yUqEPW4xfsdwon7casuM","value":"0.9"},"TakerPays":"90000000"},"LedgerEntryType":"Offer","LedgerIndex":"E6CF232C1D5E5B78729985C1A0D58C2DADBA808F760787395DF65783BBE125CD","PreviousFields":{"TakerGets":{"currency":"FAK","issuer":"rLpq5RcRzA8FU1yUqEPW4xfsdwon7casuM","value":"1"},"TakerPays":"100000000"},"PreviousTxnID":"74FFA0E05D3C9DDDE66034836D2F81BB4B62A5EE8F7860C447C091D69109E977","PreviousTxnLgrSeq":5964360}},{"ModifiedNode":{"FinalFields":{"Flags":0,"Owner":"rKXCummUHnenhYudNb9UoJ4mGBR75vFcgz","RootIndex":"F655EAF4786194E0F98C74517D2444AC6932FDAD9EBB69F06394330298A52C15"},"LedgerEntryType":"DirectoryNode","LedgerIndex":"F655EAF4786194E0F98C74517D2444AC6932FDAD9EBB69F06394330298A52C15"}},{"ModifiedNode":{"FinalFields":{"Account":"rNw4ozCG514KEjPs5cDrqEcdsi31Jtfm5r","Balance":"132019458","Flags":0,"OwnerCount":5,"Sequence":128},"LedgerEntryType":"AccountRoot","LedgerIndex":"FA39C6EC43AA870B5E9ED592EF683CC1134DB60746C54A997B6BEAE366EF04C9","PreviousFields":{"Balance":"122019458"},"PreviousTxnID":"74FFA0E05D3C9DDDE66034836D2F81BB4B62A5EE8F7860C447C091D69109E977","PreviousTxnLgrSeq":5964360}}],"TransactionIndex":1,"TransactionResult":"tesSUCCESS"},"validated":true}'
      var tx = JSON.parse(tx_str);

      order_formatter.parseOrderFromTx(tx, {
        account: 'rKXCummUHnenhYudNb9UoJ4mGBR75vFcgz',
        currency_prioritization: [ 'XRP' ]
      }, function(err, order){
        expect(err).not.to.exist;
        expect(order.is_bid).to.be.false;
        expect(order.base_amount.value).to.equal('10');
        expect(order.base_amount.currency).to.equal('XRP');
        expect(order.counter_amount.value).to.equal('0.1');
        expect(order.counter_amount.currency).to.equal('FAK');
        expect(order.exchange_rate).to.equal('0.01');
        expect(order.state).to.equal('filled');
        expect(order.sequence).to.equal('218');
        expect(order.ledger).to.equal('5997476');
        expect(order.hash).to.equal('78B09A606C0CE5D1E2C3C889410CB8E8A5D20C62B2A0D487DFFBECE82A791822');
      });

    });

    it('should parse immediate_or_cancel and fill_or_kill orders, even if they did not create ledger entries', function(){



    });


    // it('should parse an order created from an OfferCreate transaction', function(){

    //   // order_formatter.parseOrderFromTx(tx_offercreate_newoffer, {
    //   //   account: 'rLpq5RcRzA8FU1yUqEPW4xfsdwon7casuM'
    //   // }, function(err, order){
    //   //   expect(err).not.to.exist;
    //   //   expect(order).to.deep.equal(order_offercreate_newoffer);
    //   // });

    // });

    // it('should parse an order partially filled by an OfferCreate transaction', function(){

    // });

    // it('should parse the correct order partially filled by an OfferCreate transaction that modified two orders from the same account', function(){

    // });

    // it('should parse an order filled by an OfferCreate transaction', function(){

    // });

    // it('should parse an order cancelled and replaced by an OfferCreate transaction', function(){

    // });

    // it('should parse an order cancelled aby an OfferCancel transaction', function(){

    // });

    // it('should parse an order partially filled by a Payment transaction', function(){

    // });

    // it('should parse the correct order modified by a Payment transaction that modified two orders from the same account', function(){

    // });

    // it('should parse an order deleted by a Payment transaction', function(){

    // });

    // it('should parse an immediate_or_cancel order', function(){

    // });

    // it('should parse a fill_or_kill order', function(){

    // });

  });

  describe('.sumOrdersExercisedByTx()', function(){

    it('should parse a transaction where only one order was modified', function(){

      expect(order_formatter.sumOrdersExercisedByTx({
        Account : "rLpq5RcRzA8FU1yUqEPW4xfsdwon7casuM",
        TakerGets : {
          currency : "USD",
          issuer : "rMwjYedjc7qqtKYVLiAccJSmCwih4LnE2q",
          value : "0.1"
        },
        TakerPays : "10000000",
        TransactionType : "OfferCreate",
        meta : {
          AffectedNodes : [
            {
              ModifiedNode : {
                FinalFields : {
                  Account : "rE9KY28Z9Ru9y1mS3UMWWExA1cFJDjcxdN",
                  BookDirectory : "CF8D13399C6ED20BA82740CFA78E928DC8D498255249BA634C1E56D2182A6420",
                  BookNode : "0000000000000000",
                  Flags : 0,
                  OwnerNode : "0000000000000000",
                  Sequence : 2409,
                  TakerGets : "1005443846",
                  TakerPays : {
                    currency : "USD",
                    issuer : "rMwjYedjc7qqtKYVLiAccJSmCwih4LnE2q",
                    value : "8.58619851409053"
                  }
                },
                LedgerEntryType : "Offer",
                LedgerIndex : "15C672582937837A21139AED9F6829E037BF4B4CF739332E5CF69CA7CF58899D",
                PreviousFields : {
                  TakerGets : "1017153846",
                  TakerPays : {
                    currency : "USD",
                    issuer : "rMwjYedjc7qqtKYVLiAccJSmCwih4LnE2q",
                    value : "8.68619851409053"
                  }
                },
                PreviousTxnID : "EDFD30AC0A0F4D248BC68A47172C36946C8CED8A1C6E7B4CC3073D1511E78A0B",
                PreviousTxnLgrSeq : 5892501
              }
            }
          ]
        }
      })).to.deep.equal({
        TakerPays: '11710000',
        TakerGets: {
          currency : "USD",
          issuer : "rMwjYedjc7qqtKYVLiAccJSmCwih4LnE2q",
          value : "0.1"
        }
      });

    });

    it('should parse a transaction where multiple orders were modified', function(){

      expect(order_formatter.sumOrdersExercisedByTx({
        Account : "rLpq5RcRzA8FU1yUqEPW4xfsdwon7casuM",
        TakerGets : {
          currency : "USD",
          issuer : "rMwjYedjc7qqtKYVLiAccJSmCwih4LnE2q",
          value : "65"
        },
        TakerPays : "8385000000",
        TransactionType : "OfferCreate",
        meta : {
          AffectedNodes : [
            {
              DeletedNode : {
                FinalFields : {
                  Account : "rHsZHqa5oMQNL5hFm4kfLd47aEMYjPstpg",
                  BookDirectory : "CF8D13399C6ED20BA82740CFA78E928DC8D498255249BA634C1B8683BCE6EDA9",
                  BookNode : "0000000000000000",
                  Flags : 0,
                  OwnerNode : "0000000000000001",
                  PreviousTxnID : "D30A92F7ADF4934803CEC2332C767CB07110C017A499160DD44414543C561306",
                  PreviousTxnLgrSeq : 5873907,
                  Sequence : 448305,
                  TakerGets : "0",
                  TakerPays : {
                    currency : "USD",
                    issuer : "rMwjYedjc7qqtKYVLiAccJSmCwih4LnE2q",
                    value : "0"
                  }
                },
                LedgerEntryType : "Offer",
                LedgerIndex : "015591BC250BC2EDDCBE7F09582BD13CE19143847DC66F267D66DFC7BD52C033",
                PreviousFields : {
                  TakerGets : "3359172828",
                  TakerPays : {
                    currency : "USD",
                    issuer : "rMwjYedjc7qqtKYVLiAccJSmCwih4LnE2q",
                    value : "26.025946423"
                  }
                }
              }
            },
            {
              DeletedNode : {
                FinalFields : {
                  Account : "rPEZyTnSyQyXBCwMVYyaafSVPL8oMtfG6a",
                  BookDirectory : "CF8D13399C6ED20BA82740CFA78E928DC8D498255249BA634C1B87C7D1CCD889",
                  BookNode : "0000000000000000",
                  Flags : 0,
                  OwnerNode : "0000000000002525",
                  PreviousTxnID : "66744FA1B5A9C26C06140AE191554EE3064EBE647F08C340CDF8B68C11B8BB14",
                  PreviousTxnLgrSeq : 5873871,
                  Sequence : 418826,
                  TakerGets : "0",
                  TakerPays : {
                    currency : "USD",
                    issuer : "rMwjYedjc7qqtKYVLiAccJSmCwih4LnE2q",
                    value : "0"
                  }
                },
                LedgerEntryType : "Offer",
                LedgerIndex : "79F5D6879BA10A04534590ABE3ACCA93476AF6D454408B126CA5CF901F8A5FF7",
                PreviousFields : {
                  TakerGets : "771588410",
                  TakerPays : {
                    currency : "USD",
                    issuer : "rMwjYedjc7qqtKYVLiAccJSmCwih4LnE2q",
                    value : "5.979128602047855"
                  }
                }
              }
            },
            {
              DeletedNode : {
                FinalFields : {
                  Account : "rPEZyTnSyQyXBCwMVYyaafSVPL8oMtfG6a",
                  BookDirectory : "CF8D13399C6ED20BA82740CFA78E928DC8D498255249BA634C1B89BAC2BD72F3",
                  BookNode : "0000000000000000",
                  Flags : 0,
                  OwnerNode : "0000000000002525",
                  PreviousTxnID : "FC817A6CA3D99313F500CF5B91280ECB0FB4A6032694EC3162337992724C9527",
                  PreviousTxnLgrSeq : 5873872,
                  Sequence : 418827,
                  TakerGets : "0",
                  TakerPays : {
                    currency : "USD",
                    issuer : "rMwjYedjc7qqtKYVLiAccJSmCwih4LnE2q",
                    value : "0"
                  }
                },
                LedgerEntryType : "Offer",
                LedgerIndex : "7E41D5C9D09C58FACD496543D4AEF825FEC7556B06DC440EA8B7C156CB12C93B",
                PreviousFields : {
                  TakerGets : "1928437736",
                  TakerPays : {
                    currency : "USD",
                    issuer : "rMwjYedjc7qqtKYVLiAccJSmCwih4LnE2q",
                    value : "14.94782150511963"
                  }
                }
              }
            },
            {
              ModifiedNode : {
                FinalFields : {
                  Account : "rp1yaMvwCfsMViDkU6zWyARsh7M5T8iMBf",
                  BookDirectory : "CF8D13399C6ED20BA82740CFA78E928DC8D498255249BA634C1B89CCCEB77425",
                  BookNode : "0000000000000000",
                  Flags : 0,
                  OwnerNode : "0000000000000000",
                  Sequence : 3596,
                  TakerGets : "23473743181",
                  TakerPays : {
                    currency : "USD",
                    issuer : "rMwjYedjc7qqtKYVLiAccJSmCwih4LnE2q",
                    value : "181.9528965301675"
                  }
                },
                LedgerEntryType : "Offer",
                LedgerIndex : "E9C6A9F46425980323B2E65230DA24136004C0EC94A3335018E30821AD801B52",
                PreviousFields : {
                  TakerGets : "25802000000",
                  TakerPays : {
                    currency : "USD",
                    issuer : "rMwjYedjc7qqtKYVLiAccJSmCwih4LnE2q",
                    value : "200"
                  }
                },
                PreviousTxnID : "4FDB0EB6DA8D307B044B43798ACA5DE91CC226DF125A295234B40CFE9FB618C3",
                PreviousTxnLgrSeq : 5872635
              }
            }
          ]
        }
      })).to.deep.equal({
        TakerPays: '8387455793',
        TakerGets: {
          currency : "USD",
          issuer : "rMwjYedjc7qqtKYVLiAccJSmCwih4LnE2q",
          value : "65"
        }
      });

    });

    it('should properly parse an order that was bridged through XRP', function(){

      throw(new Error('Add test!'));

    });

  });

  describe('.baseCurrencyIsTakerGets()', function(){

    it('should properly handle XRP written as a string', function(){

      expect(order_formatter.baseCurrencyIsTakerGets('10', {
        value: 1, 
        currency: 'USD', 
        issuer: 'r...'
      }, {
        currency_prioritization: [ 'XRP', 'USD' ]
      })).to.be.true;

    });

    it('should return true if both currencies are in the currency_prioritization and the taker_gets has a higher priority', function(){

      expect(order_formatter.baseCurrencyIsTakerGets({
        value: 1,
        currency: 'EUR',
        issuer: 'r...'
      }, {
        value: 1.3, 
        currency: 'USD', 
        issuer: 'r...'
      }, {
        currency_prioritization: [ 'EUR', 'USD' ]
      })).to.be.true;

    });

    it('should return false if both currencies are in the currency_prioritization and the taker_pays has a higher priority', function(){

      expect(order_formatter.baseCurrencyIsTakerGets({
        value: 1.3, 
        currency: 'USD', 
        issuer: 'r...'
      }, {
        value: 1,
        currency: 'EUR',
        issuer: 'r...'
      }, {
        currency_prioritization: [ 'EUR', 'USD' ]
      })).to.be.false;

    });

    it('should return true if only the taker_gets is in the currency_prioritization', function(){

      expect(order_formatter.baseCurrencyIsTakerGets({
        value: 1,
        currency: 'EUR',
        issuer: 'r...'
      }, {
        value: 1.3, 
        currency: 'USD', 
        issuer: 'r...'
      }, {
        currency_prioritization: [ 'EUR' ]
      })).to.be.true;

    });

    it('should return false if only the taker_pays is in the currency_prioritization', function(){

      expect(order_formatter.baseCurrencyIsTakerGets({
        value: 1,
        currency: 'EUR',
        issuer: 'r...'
      }, {
        value: 1.3, 
        currency: 'USD', 
        issuer: 'r...'
      }, {
        currency_prioritization: [ 'USD' ]
      })).to.be.false;

    });

    it('should properly override the currency_prioritization with the currency_pair_exceptions', function(){

      expect(order_formatter.baseCurrencyIsTakerGets({
        value: 1,
        currency: 'EUR',
        issuer: 'r...'
      }, {
        value: 1.3, 
        currency: 'USD', 
        issuer: 'r...'
      }, {
        currency_prioritization: [ 'USD' ],
        currency_pair_exceptions: [ 'EUR/USD' ]
      })).to.be.true;

      expect(order_formatter.baseCurrencyIsTakerGets({
        value: 1.3, 
        currency: 'USD', 
        issuer: 'r...'
      }, {
        value: 1,
        currency: 'EUR',
        issuer: 'r...'
      }, {
        currency_prioritization: [ 'USD' ],
        currency_pair_exceptions: [ 'EUR/USD' ]
      })).to.be.false;

    });

    it('should return true if neither currency is in the currency_prioritization, nor in the currency_pair_exceptions, and the taker_gets is alphabetically first', function(){

      expect(order_formatter.baseCurrencyIsTakerGets({
        value: 1,
        currency: 'EUR',
        issuer: 'r...'
      }, {
        value: 1.3, 
        currency: 'USD', 
        issuer: 'r...'
      }, {
        currency_prioritization: [ ]
      })).to.be.true;

    });

    it('should return false if neither currency is in the currency_prioritization, nor in the currency_pair_exceptions, and the taker_pays is alphabetically first', function(){

      expect(order_formatter.baseCurrencyIsTakerGets({
        value: 1.3, 
        currency: 'USD', 
        issuer: 'r...'
      }, {
        value: 1,
        currency: 'EUR',
        issuer: 'r...'
      }, {
        currency_prioritization: [ ]
      })).to.be.false;

    });

    it('should return true if the currencies are the same and the taker_gets issuer is first lexicographically', function(){

      expect(order_formatter.baseCurrencyIsTakerGets({
        value: 1.0005, 
        currency: 'USD', 
        issuer: 'r1...'
      }, {
        value: 1.0010,
        currency: 'USD',
        issuer: 'r2...'
      }, {
        currency_prioritization: [ ]
      })).to.be.true;

    });

    it('should return false if the currencies are the same and the taker_pays issuer is first lexicographically', function(){

      expect(order_formatter.baseCurrencyIsTakerGets({
        value: 1.0005, 
        currency: 'USD', 
        issuer: 'r2...'
      }, {
        value: 1.0010,
        currency: 'USD',
        issuer: 'r1...'
      }, {
        currency_prioritization: [ ]
      })).to.be.false;

    });

  });

});