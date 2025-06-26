const express = require('express');
const cors = require('cors');
const ytdl = require('ytdl-core');
const app = express();

// Middleware للسماح بطلبات من الواجهة الأمامية
app.use(cors());
app.use(express.json());

// نقطة نهاية للتحميل
app.get('/download', async (req, res) => {
    const { videoUrl, type, quality } = req.query;

    if (!videoUrl || !type) {
        return res.status(400).send('المعطيات ناقصة!');
    }

    try {
        const info = await ytdl.getInfo(videoUrl);
        const title = info.videoDetails.title.replace(/[^\w\s-]/g, '');

        if (type === 'audio') {
            res.header('Content-Disposition', `attachment; filename="${title}.mp3"`);
            ytdl(videoUrl, { quality: 'highestaudio', filter: 'audioonly' }).pipe(res);
        } else {
            res.header('Content-Disposition', `attachment; filename="${title}.mp4"`);
            ytdl(videoUrl, { quality: quality || 'highest' }).pipe(res);
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('حدث خطأ أثناء التحميل!');
    }
});

// تشغيل الخادم على المنفذ 3001
const PORT = 3001;
app.listen(PORT, () => {
    console.log(`الخادم يعمل على http://localhost:${PORT}`);
});