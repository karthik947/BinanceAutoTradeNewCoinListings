const $ = require('jquery');
const api = require('binance');
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;

var gv_sym = {};
var gv_sympairs = {};
var new_coin = '';
var gv_timer = 2*1000;
var gv_markup = '';
var gv_buyprecision;
var gv_residueth;

var sell_coin = {
    "eflag" : false,
    "coin"  : "",
    "coinp" : "",
    "qty"   : "",
}

var gv_peak,gv_low;

var gv_coinmcap = {};

//Delete NULS = To Test the tool
/*setTimeout(deleteNuls,60*1000);

function deleteNuls(){
    delete gv_sym["NULS"];
}*/


//Get All Symbols onload
var ourRequestx = new XMLHttpRequest();
ourRequestx.open('GET','https://api.binance.com/api/v3/ticker/price',true);
ourRequestx.onload = function(){
    var gv_sym_l = {};
    ourDatax = JSON.parse(ourRequestx.responseText);
    for(k=0;k<ourDatax.length;k++){
        //Update Symbol Pairs
        gv_sympairs[ourDatax[k]["symbol"]] = ourDatax[k]["price"];
        
        //Update and Check for new symbols
        if(ourDatax[k]["symbol"].substr(ourDatax[k]["symbol"].length - 4, ourDatax[k]["symbol"].length) == 'USDT'){
            if(!gv_sym_l[ourDatax[k]["symbol"].substr(0,ourDatax[k]["symbol"].length - 4)]){
               gv_sym_l[ourDatax[k]["symbol"].substr(0,ourDatax[k]["symbol"].length - 4)] = '1';
               }
        }
        else{
            if(!gv_sym_l[ourDatax[k]["symbol"].substr(0,ourDatax[k]["symbol"].length - 3)]){
               gv_sym_l[ourDatax[k]["symbol"].substr(0,ourDatax[k]["symbol"].length - 3)] = '1';
               }
        }
    }
    gv_sym = gv_sym_l;
}
ourRequestx.send();


//Get All the ranks from CoinMarketCap
var ourRequestc = new XMLHttpRequest();
ourRequestc.open('GET',"https://api.coinmarketcap.com/v1/ticker/?limit=2000",true);
ourRequestc.onload = function(){
     ourDatac = JSON.parse(ourRequestc.responseText);
     for(y=0;y<ourDatac.length;y++){
         gv_coinmcap[ourDatac[y]["symbol"]] = ourDatac[y]["rank"];
     }
}
ourRequestc.send();

updatesymbols();

function updatesymbols(){
    if(new_coin.length > 0 && $('#tradeon').is(':checked')){
       executeBuyTrade();
    }
    else{
       if(Object.keys(gv_sym).length > 0){getallsymbols();}
    }
    if(sell_coin["eflag"] == true){
       getallsymbols();
       executeSellTrade();
       refreshWidget();
    }
    setTimeout(updatesymbols,gv_timer);
}
        
        
        
function getallsymbols(){
    var ourRequest1 = new XMLHttpRequest();
    ourRequest1.open('GET','https://api.binance.com/api/v3/ticker/price',true);
    ourRequest1.onload = function(){
        ourDatax = JSON.parse(ourRequest1.responseText);
        for(k=0;k<ourDatax.length;k++){
            
            //Update SymbolPair Prices
            gv_sympairs[ourDatax[k]["symbol"]] = ourDatax[k]["price"];
            
            if(ourDatax[k]["symbol"].substr(ourDatax[k]["symbol"].length - 4, ourDatax[k]["symbol"].length) == 'USDT'){
                if(!gv_sym[ourDatax[k]["symbol"].substr(0,ourDatax[k]["symbol"].length - 4)]){
                   gv_sym[ourDatax[k]["symbol"].substr(0,ourDatax[k]["symbol"].length - 4)] = '1';
                   if(!(new_coin.length > 0)){
                       //Check the ranking before updating new coin:-
                       var lv_rank = parseInt(gv_coinmcap[ourDatax[k]["symbol"].substr(0,ourDatax[k]["symbol"].length - 4)]);
                       var lv_shouldbuy = false;
                       
                       if($('#crank').is(':checked')){
                           if($('#skipim').is(':checked')){
                              if(!lv_rank){
                                 lv_shouldbuy = true;
                               }
                               else if(lv_rank <= parseInt($('#crankval').val())){
                                  lv_shouldbuy = true; 
                               }
                            }
                           else{
                               if(lv_rank && (lv_rank <= parseInt($('#crankval').val()))){
                                  lv_shouldbuy = true; 
                               }
                           }
                       }
                       else{
                           lv_shouldbuy = true;
                       }
                       
                       if(lv_shouldbuy){
                          new_coin = ourDatax[k]["symbol"].substr(0,ourDatax[k]["symbol"].length - 4);
                        }
                       }
                   }
            }
            else{
                if(!gv_sym[ourDatax[k]["symbol"].substr(0,ourDatax[k]["symbol"].length - 3)]){
                    gv_sym[ourDatax[k]["symbol"].substr(0,ourDatax[k]["symbol"].length - 3)] = '1';
                    if(!(new_coin.length > 0)){
                       //Check the ranking before updating new coin:- 
                       var lv_rank = parseInt(gv_coinmcap[ourDatax[k]["symbol"].substr(0,ourDatax[k]["symbol"].length - 3)]);
                       var lv_shouldbuy = false;
                       if($('#crank').is(':checked')){
                           if($('#skipim').is(':checked')){
                              if(!lv_rank){
                                 lv_shouldbuy = true;
                               }
                               else if(lv_rank <= parseInt($('#crankval').val())){
                                  lv_shouldbuy = true; 
                               }
                            }
                           else{
                               if(lv_rank && (lv_rank <= parseInt($('#crankval').val()))){
                                  lv_shouldbuy = true; 
                               }
                           }
                       }
                       else{
                           lv_shouldbuy = true;
                       }
                        
                       if(lv_shouldbuy){
                          new_coin = ourDatax[k]["symbol"].substr(0,ourDatax[k]["symbol"].length - 3);
                        } 
                       }
                   }
            }   
        }
    }
    ourRequest1.send();
}


function executeBuyTrade(){
    
    var lv_new_coin = new_coin;
    new_coin = '';
    var lv_btcbal1,lv_btcbal2,lv_btcbal3,lv_btcbal,lv_qty;
    
    if($('#ffrom option:selected').val() == 'TUSD'){
        
        //Buy ETH
        const binanceRest1 = new api.BinanceRest({
            key: $('#apikey').val() + "", // Get this from your account on binance.com
            secret:  $('#seckey').val() + "", // Same for this
            timeout: 15000, // Optional, defaults to 15000, is the request time out in milliseconds
            recvWindow: 10000, // Optional, defaults to 5000, increase if you're getting timestamp errors
            disableBeautification: false,
            handleDrift: true
        });
        
        
        binanceRest1.account()
        .then((accountInfo1) => {
            for(l=0;l<accountInfo1["balances"].length;l++){
                if(accountInfo1["balances"][l]["asset"] == "ETH"){
                   lv_btcbal1 = parseFloat(accountInfo1["balances"][l]["free"]);
                }
            }
            
            //Get Precision
            return binanceRest1.exchangeInfo();
        })
        .then((exchangeInfoResp) => {
            //Calculate precision
            for(x=1;x<exchangeInfoResp["symbols"].length;x++){
                if(exchangeInfoResp["symbols"][x]["symbol"] == lv_new_coin + "ETH"){
                   gv_buyprecision = parseInt(decimalPlaces(parseFloat(exchangeInfoResp["symbols"][x]["filters"][2]["stepSize"])));
                }
            }
            
            return binanceRest1.newOrder({
                    symbol:  'TUSDETH',
                    side: 'SELL',
                    type: 'MARKET',
                    quantity: parseFloat($('#famount').val()),
                    newOrderRespType: 'FULL',
                    });
        })
        .then((order1Resp) => {
            console.log(order1Resp);
            return binanceRest1.account();
        })
        .then((accountInfo2) => {
            for(m=0;m<accountInfo2["balances"].length;m++){
                if(accountInfo2["balances"][m]["asset"] == "ETH"){
                   lv_btcbal2 = parseFloat(accountInfo2["balances"][m]["free"]);
                }
            }
            
            var lv_p = parseFloat(gv_sympairs[lv_new_coin + 'ETH']);
            lv_btcbal = lv_btcbal2 - lv_btcbal1;
            
            //lv_qty = parseFloat(lv_btcbal/lv_p).toFixed(gv_buyprecision);
            var lv_qty_b = parseFloat(lv_btcbal/lv_p);
            var lv_exp = 10**gv_buyprecision;
            lv_qty = (Math.floor(lv_exp * lv_qty_b) / lv_exp).toFixed(gv_buyprecision);
            
            return  binanceRest1.newOrder({
                        symbol:  lv_new_coin + 'ETH',
                        side: 'BUY',
                        type: 'MARKET',
                        quantity: lv_qty,
                        newOrderRespType: 'FULL',
                    });
        })
        .then((order2Resp) => {
            console.log(order2Resp);
            
            return binanceRest1.account();
        })
        .then((accountInfo3) => {
            //Find residual ETH
            for(n=0;n<accountInfo3["balances"].length;n++){
                if(accountInfo3["balances"][n]["asset"] == "ETH"){
                   lv_btcbal3 = parseFloat(accountInfo3["balances"][n]["free"]);
                }
            }
            gv_residueth = lv_btcbal3 - lv_btcbal1;
            
            
            sell_coin["eflag"] = true;
            sell_coin["coin"] = lv_new_coin;
            //sell_coin["coinp"] = parseFloat(parseFloat($('#famount').val())/lv_qty);
            sell_coin["coinp"] = parseFloat(gv_sympairs[sell_coin["coin"] + "ETH"]/parseFloat(gv_sympairs["TUSDETH"]));
            gv_peak = sell_coin["coinp"];
            gv_low = parseFloat((100 - parseFloat($('#tstop').val()))*gv_peak/100);
            sell_coin["qty"] = lv_qty;
            gv_markup = $('#famount').val() + "(TUSD) -> " + lv_btcbal + "(ETH) -> " + sell_coin["qty"] + "(" + sell_coin["coin"] + ") -> ";
            $('#status3').html(gv_markup);
            
            document.getElementById("exitTradeNow").disabled = false;
            
            //Disable input fields
            document.getElementById("famount").disabled = true;
            document.getElementById("asell").disabled = true;
            document.getElementById("tstop").disabled = true;
            document.getElementById("crank").disabled = true;
            document.getElementById("crankval").disabled = true;
            
        })
        .catch((err) => {
            console.error(err);
        });
        
    }
    
}

function executeSellTrade(){
    
    //Check Trailing Stop Condition is met.
    var lv_currp = parseFloat(gv_sympairs[sell_coin["coin"] + "ETH"]/parseFloat(gv_sympairs["TUSDETH"]));
    if(lv_currp > gv_peak){
       gv_peak = lv_currp;
       gv_low = parseFloat((100 - parseFloat($('#tstop').val()))*gv_peak/100);
    }
    else if(lv_currp < gv_low){ //Is price less than trailing stop

        //Sell Off
        exitTradeNowFunc();
           
    }
}

$("#exitTradeNow").click(function(){
    exitTradeNowFunc();
});

function refreshWidget(){
    var lv_currp = parseFloat(gv_sympairs[sell_coin["coin"] + "ETH"]/parseFloat(gv_sympairs["TUSDETH"]));
    var lv_currVal = parseFloat(parseFloat(sell_coin["qty"])*lv_currp).toFixed(2);
    
    var lv_chg = parseFloat((lv_currVal - parseFloat($('#famount').val()))*100/parseFloat($('#famount').val())).toFixed(2);
    
    $('#status1').html(lv_currVal + '$');
    $('#status2').html(lv_chg + '%');
    
    if(lv_chg > 0){
        $('#status4').removeClass("text-danger");
        $('#status4').addClass("text-success");
    }
    else{
        $('#status4').removeClass("text-success");
        $('#status4').addClass("text-danger");
    }
    
}

function exitTradeNowFunc(){
sell_coin["eflag"] = false;
var lv_btcbal1,lv_btcbal2,lv_btcbal,lv_qty;    
    
        const binanceRest1 = new api.BinanceRest({
        key: $('#apikey').val() + "", // Get this from your account on binance.com
        secret:  $('#seckey').val() + "", // Same for this
        timeout: 15000, // Optional, defaults to 15000, is the request time out in milliseconds
        recvWindow: 10000, // Optional, defaults to 5000, increase if you're getting timestamp errors
        disableBeautification: false,
        handleDrift: true
        });
        
        
        binanceRest1.account()
        .then((accountInfo1) => {
            for(l=0;l<accountInfo1["balances"].length;l++){
                if(accountInfo1["balances"][l]["asset"] == "ETH"){
                   lv_btcbal1 = parseFloat(accountInfo1["balances"][l]["free"]);
                }
            }
            
        return binanceRest1.newOrder({
                symbol: sell_coin["coin"] + 'ETH',
                side: 'SELL',
                type: 'MARKET',
                quantity: parseFloat(sell_coin["qty"]),
                newOrderRespType: 'FULL',
               });
        })
        .then((order1Resp) => {
            console.log(order1Resp);
            return binanceRest1.account();
        })
        .then((accountInfo2) => {
            for(m=0;m<accountInfo2["balances"].length;m++){
                if(accountInfo2["balances"][m]["asset"] == "ETH"){
                   lv_btcbal2 = parseFloat(accountInfo2["balances"][m]["free"]);
                }
            }
            
            var lv_p = parseFloat(gv_sympairs['TUSDETH']); 
            lv_btcbal = lv_btcbal2 - lv_btcbal1 + gv_residueth;
            lv_qty_b = parseFloat(lv_btcbal/lv_p);
            lv_qty = (Math.floor(1 * lv_qty_b) / 1).toFixed(0);
            
            return binanceRest1.newOrder({
                        symbol:  'TUSDETH',
                        side: 'BUY',
                        type: 'MARKET',
                        quantity: lv_qty,
                        newOrderRespType: 'FULL',
                    });
        })
        .then((order2Resp) => {
            console.log(order2Resp);
            gv_markup += lv_btcbal + "(ETH) -> " + lv_qty + "(TUSD)";
            $('#status3').html(gv_markup);
            
        })
        .catch((err) => {
            console.error(err);
        });   
    
}

function jsonLen(a1){
    return Object.keys(a1).length;
}

function getNowDTime(){
    var dnow = new Date();
    return dnow.toLocaleString()
}


function decimalPlaces(num) {
  var match = (''+num).match(/(?:\.(\d+))?(?:[eE]([+-]?\d+))?$/);
  if (!match) { return 0; }
  return Math.max(
       0,
       // Number of digits right of decimal point.
       (match[1] ? match[1].length : 0)
       // Adjust for scientific notation.
       - (match[2] ? +match[2] : 0));
}