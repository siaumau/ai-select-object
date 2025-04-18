const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const dns = require('dns');
const https = require('https');
const app = express();

// 設置DNS解析器
dns.setServers([
    '8.8.8.8',  // Google DNS
    '1.1.1.1',  // Cloudflare DNS
    '208.67.222.222'  // OpenDNS
]);

// 啟用 CORS
app.use(cors());
app.use(express.json({limit: '50mb'}));
app.use(express.static('public'));

// 自定義 fetch 配置
const customFetch = (url, options) => {
    const httpsAgent = new https.Agent({
        rejectUnauthorized: true,
        timeout: 10000,
        keepAlive: true
    });

    return fetch(url, {
        ...options,
        agent: httpsAgent,
        timeout: 30000 // 30 秒超時
    });
};

// 代理 API 請求
app.post('/api/detect', async (req, res) => {
    try {
        // 先測試DNS解析
        await new Promise((resolve, reject) => {
            dns.resolve4('api.openrouter.ai', (err, addresses) => {
                if (err) {
                    console.error('DNS解析錯誤:', err);
                    reject(new Error('無法解析API域名，請檢查網路連接'));
                } else {
                    console.log('API域名解析成功:', addresses);
                    resolve(addresses);
                }
            });
        });

        const response = await customFetch('https://api.openrouter.ai/api/v1/vision/detect', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer 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'
            },
            body: JSON.stringify(req.body)
        });

        if (!response.ok) {
            throw new Error(`API responded with status: ${response.status}`);
        }

        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Proxy Error:', error);
        res.status(500).json({
            error: '代理伺服器錯誤',
            details: error.message,
            type: error.type || 'UNKNOWN'
        });
    }
});

const PORT = process.env.PORT || 4001;
app.listen(PORT, () => {
    console.log(`代理伺服器運行在 http://localhost:${PORT}`);
    // 測試DNS
    dns.resolve4('api.openrouter.ai', (err, addresses) => {
        if (err) {
            console.error('警告: DNS解析測試失敗 -', err.message);
        } else {
            console.log('DNS解析測試成功:', addresses);
        }
    });
}); 