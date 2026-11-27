import test from 'node:test';
import assert from 'node:assert/strict';
import {createHmac} from 'node:crypto';
import {PaytrTestAttempt,handleApi} from '../worker/index.js';

const origin = 'https://nfchane.com';
function fixture({linked=false,orderStatus='awaiting_payment',isTest=true}={}) {
  const owner = 'cc4519e2-b3ba-4b34-b657-a5680d71ae31';
  const requestKey = 'a7ed1d03-0d4c-456c-9f90-223b3cd08429';
  const reference = (linked?'NFCO':'NFCT')+requestKey.replaceAll('-','');
  const objects = new Map();
  const store = {
    idFromName:id=>id,
    get(id) {
      if (!objects.has(id)) {
        const values = new Map();
        let queue = Promise.resolve();
        const ctx = {
          storage:{
            get:async key=>values.get(key),
            put:async (key,value)=>{values.set(key,value);},
            setAlarm:async()=>{},
          },
          blockConcurrencyWhile(work) {
            const result=queue.then(work);
            queue=result.catch(()=>{});
            return result;
          },
        };
        objects.set(id,new PaytrTestAttempt(ctx));
      }
      return {fetch:(url,init)=>objects.get(id).fetch(new Request(url,init))};
    },
  };
  const env = {
    APP_ORIGIN:origin, SUPABASE_URL:'https://exampleproject.supabase.co',
    SUPABASE_PUBLISHABLE_KEY:'sb_publishable_fixture',ADMIN_LOGIN_EMAIL:'admin@example.invalid',
    PAYTR_TEST_ATTEMPTS:store, PAYTR_TEST_BUYER_EMAIL:'paytr@example.invalid',
    PAYTR_MERCHANT_ID:'1234', PAYTR_MERCHANT_KEY:'fixture-key',PAYTR_MERCHANT_SALT:'fixture-salt',
  };
  let providerCalls = 0;
  let providerRejects = false;
  const fetcher = async (url,init) => {
    if (url.endsWith('/auth/v1/user')) return Response.json({id:owner,email_confirmed_at:'2026-11-20'});
    if (url.endsWith('/rest/v1/rpc/admin_session')) return Response.json({id:owner,role:'owner'});
    if (url.endsWith('/rest/v1/rpc/admin_order_detail')) return Response.json({
      order:{id:requestKey,is_test:isTest,status:orderStatus,created_at:new Date().toISOString(),customer_email:'private@example.invalid'},
      items:[{product_id:'google',connection_method:'hybrid',link_type:'dynamic',quantity:2,unit_price_minor:1},
        {product_id:'iban',connection_method:'nfc',link_type:'static',quantity:1,unit_price_minor:0}],
    });
    if (url !== 'https://www.paytr.com/odeme/api/get-token') throw new Error('Unexpected provider call');
    providerCalls++;
    const form = new URLSearchParams(init.body);
    assert.equal(form.get('test_mode'),'1');
    assert.equal(form.get('payment_amount'),linked?'115000':'1000');
    assert.equal(form.get('email'),'paytr@example.invalid');
    assert.equal(form.get('no_installment'),'1');
    assert.equal(form.get('merchant_oid'),reference);
    assert.deepEqual(JSON.parse(Buffer.from(form.get('user_basket'),'base64').toString('utf8')),linked?[['NFCHane google · dynamic','400.00',2],['NFCHane iban · static','350.00',1]]:[['NFCHane test kartı','10.00',1]]);
    const fieldNames = ['merchant_id','user_ip','merchant_oid','email','payment_amount','user_basket','no_installment','max_installment','currency','test_mode'];
    const expected = createHmac('sha256','fixture-key')
      .update(fieldNames.map(name=>form.get(name)).join('')+env.PAYTR_MERCHANT_SALT).digest('base64');
    assert.equal(form.get('paytr_token'),expected);
    assert.equal(form.has('merchant_key'),false);
    assert.equal(form.has('merchant_salt'),false);
    return providerRejects ? Response.json({status:'failed',reason:'provider-internal-error'}) :
      Response.json({status:'success',token:'fixture-token'});
  };
  const admin = (path,data,auth=true) => {
    const headers = {Origin:origin,'CF-Connecting-IP':'192.0.2.1'};
    if (auth) headers.Cookie='__Host-nfchane_access=fixture';
    if (data) headers['Content-Type']='application/json';
    return handleApi(new Request(origin+path,{headers,...(data?{method:'POST',body:JSON.stringify(data)}:{})}),env,fetcher);
  };
  const callback = ({status='success',amount='1000',...edits}={}) => {
    const hash = createHmac('sha256','fixture-key')
      .update(reference+env.PAYTR_MERCHANT_SALT+status+amount).digest('base64');
    const body = new URLSearchParams({merchant_oid:reference,status,total_amount:amount,hash,
      payment_amount:amount,payment_type:'card',currency:'TL',test_mode:'1',...edits});
    return handleApi(new Request(origin+'/api/paytr/test/callback',{method:'POST',body}),env,fetcher);
  };
  return {env,admin,reference,requestKey,callback,providerCalls:()=>providerCalls,
    rejectProvider:()=>{providerRejects=true;}};
}

test('admin guest fixture sends a signed test-mode token request and processes callback exactly once',async()=>{
  const f=fixture();
  const start='/api/admin/paytr-test/start';
  assert.equal((await f.admin(start,{requestKey:f.requestKey},false)).status,401);
  const [first,retry]=await Promise.all([f.admin(start,{requestKey:f.requestKey,amountMinor:1}),f.admin(start,{requestKey:f.requestKey})]);
  assert.equal(first.status,200);
  assert.equal(retry.status,200);
  assert.equal(f.providerCalls(),1);
  const status='/api/admin/paytr-test/'+f.reference;
  const pending=await (await f.admin(status)).json();
  assert.equal(pending.status,'pending');
  assert.match(pending.iframeUrl,/paytr\.com\/odeme\/guvenli\/fixture-token$/);
  assert.equal((await f.callback({hash:'forged'})).status,400);
  assert.equal((await f.callback({amount:'999'})).status,400);
  assert.equal((await f.callback({test_mode:'0'})).status,400);
  assert.equal((await (await f.admin(status)).json()).status,'pending');
  const notifications = await Promise.all([f.callback(),f.callback()]);
  for (const reply of notifications) assert.equal(await reply.text(),'OK');
  assert.equal((await f.callback({status:'failed'})).status,400);
  const final=await (await f.admin(status)).json();
  assert.equal(final.status,'success');
  assert.equal(final.iframeUrl,null);
  assert.equal((await f.admin('/api/orders',{})).status,423);
  assert.equal((await f.admin('/api/payments',{})).status,423);
});

test('stored guest order selections use storefront pricing and the same reference across sessions and retries',async()=>{
  const path='/api/admin/paytr-test/start', f=fixture({linked:true});
  const data={orderId:f.requestKey,amountMinor:1,items:[],quote:{totalMinor:1}};
  const results=await Promise.all([f.admin(path,data),f.admin(path,{...data,requestKey:crypto.randomUUID()})]);
  for(const result of results) assert.equal(result.status,200);
  assert.equal(f.providerCalls(),1);
  assert.equal((await f.callback({amount:'1000'})).status,400);
  for(let i=0;i<2;i++) assert.equal(await (await f.callback({amount:'115000'})).text(),'OK');
  const saved=await (await f.admin(path,data)).json();
  assert.equal(saved.amountMinor,115000);
  assert.equal(saved.status,'success');
  assert.equal(saved.iframeUrl,null);
  assert.equal(f.providerCalls(),1);
  for(const options of [{isTest:false},{orderStatus:'cancelled'}]){
    const denied=fixture({linked:true,...options});
    assert.equal((await denied.admin(path,data)).status,409);
    assert.equal(denied.providerCalls(),0);
  }
});

test('failed gateway payment is final and token-provider errors do not expose provider details',async()=>{
  const f=fixture();
  const start='/api/admin/paytr-test/start';
  assert.equal((await f.admin(start,{requestKey:f.requestKey})).status,200);
  assert.equal(await (await f.callback({status:'failed',amount:'0'})).text(),'OK');
  assert.equal((await (await f.admin('/api/admin/paytr-test/'+f.reference)).json()).status,'failed');
  assert.equal((await f.callback()).status,400);

  const other=fixture();
  other.rejectProvider();
  const rejected=await other.admin(start,{requestKey:other.requestKey});
  assert.equal(rejected.status,502);
  assert.doesNotMatch(await rejected.text(),/provider-internal-error/);
  assert.equal((await (await other.admin('/api/admin/paytr-test/'+other.reference)).json()).status,'unavailable');

  delete other.env.PAYTR_MERCHANT_KEY;
  assert.equal((await other.admin(start,{requestKey:other.requestKey})).status,423);
  assert.equal((await other.callback()).status,423);
});
