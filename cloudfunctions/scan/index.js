/**
 * 小程序端用户扫描二维码后向后台推送扫描事件
 */
// 云函数入口文件
const cloud = require('wx-server-sdk');
const crypto = require('crypto');

cloud.init();

// 云函数入口函数
exports.main = async (event, context) => {
    const wxContext = cloud.getWXContext();
    const { OPENID, APPID, UNIONID, CLIENTIP, CLIENTIPV6 } = wxContext;
    const { scene } = event;

    await apiGatewayRequest({
        wxAppId: APPID,
        method: 'POST',
        host: 'service-4rma2gcr-1302919916.bj.apigw.tencentcs.com',
        path: '/api/scan',
        body: {
            wxaOpenId: OPENID,
            wxUnionId: UNIONID,
            wxaIp: CLIENTIP,
            wxaIpv6: CLIENTIPV6,
            scene,
        }
    })

    return {
        event,
        openid: wxContext.OPENID,
        appid: wxContext.APPID,
        unionid: wxContext.UNIONID,
    }
}

// 腾讯云 API 网关请求
async function apiGatewayRequest({wxAppId, method, host, path, body}) {
    const headers = 'source x-date';
    const source = 'tcb-' + wxAppId;
    const xDate = new Date().toUTCString();

    const httpMethod = method;

    const accept = 'application/json';

    const contentType = 'application/json;charset=utf-8';

    const bodyStr = JSON.stringify(body);
    const contentMd5Hex = getMd5(bodyStr);
    const contentMd5 = Buffer.from(contentMd5Hex).toString('base64');

    const pathAndParameters = path;

    const str2sign = 'source: ' + source + '\n'
                   + 'x-date: ' + xDate + '\n'
                   + httpMethod + '\n'
                   + accept + '\n'
                   + contentType + '\n'
                   + contentMd5 + '\n'
                   + pathAndParameters;
    console.log('client str2sign', str2sign);

    const hmacAlgorithm = 'sha1';
    const hmac = crypto.createHmac(hmacAlgorithm, API_APP_SECRET);
    const signature = hmac.update(str2sign).digest('base64');

    const authorization = 'hmac id="' + API_APP_KEY + '", algorithm="hmac-' + hmacAlgorithm + '", headers="' + headers + '", signature="' + signature + '"';

    const result = await got('https://' + host + pathAndParameters, {
        method: httpMethod,
        headers: {
            'source': source,
            'x-date': xDate,
            'accept': accept,
            'content-type': contentType,
            'content-md5': contentMd5,
            'authorization': authorization
        },
        body: bodyStr
    })
    return JSON.parse(result.body);
}

// 计算 md5
function getMd5(data) {
    const md5 = crypto.createHash('md5');
    return md5.update(data).digest('hex');
}
