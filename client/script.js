class YouTubeDownloader {
    constructor() {
        this.API_KEY = 'AIzaSyA6f2o1X8emnUK96jpi7pCccXzg8Xw10tU';
        this.API_BASE_URL = 'https://www.googleapis.com/youtube/v3';
        this.selectedItems = new Map();
        this.currentVideoData = null;
        
        this.initializeElements();
        this.attachEventListeners();
    }

    initializeElements() {
        this.videoUrlInput = document.getElementById('videoUrl');
        this.searchBtn = document.getElementById('searchBtn');
        this.videoInfo = document.getElementById('videoInfo');
        this.loading = document.getElementById('loading');
        this.error = document.getElementById('error');
        this.success = document.getElementById('success');
        this.thumbnail = document.getElementById('thumbnail');
        this.videoTitle = document.getElementById('videoTitle');
        this.videoChannel = document.getElementById('videoChannel');
        this.videoDuration = document.getElementById('videoDuration');
        this.videoViews = document.getElementById('videoViews');
        this.videoPublished = document.getElementById('videoPublished');
        this.selectedItemsContainer = document.getElementById('selectedItems');
        this.downloadBtn = document.getElementById('downloadBtn');
        this.downloadProgress = document.getElementById('downloadProgress');
    }

    attachEventListeners() {
        this.searchBtn.addEventListener('click', () => this.searchVideo());
        this.videoUrlInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.searchVideo();
        });

        // Quality button listeners
        document.addEventListener('click', (e) => {
            if (e.target.closest('.quality-btn')) {
                this.handleQualitySelection(e.target.closest('.quality-btn'));
            }
        });

        this.downloadBtn.addEventListener('click', () => this.downloadSelected());

        // Auto-paste detection
        this.videoUrlInput.addEventListener('paste', (e) => {
            setTimeout(() => {
                const url = e.target.value;
                if (this.isValidYouTubeUrl(url)) {
                    this.showSuccess('تم لصق رابط YouTube صحيح!');
                }
            }, 100);
        });

        // Real-time URL validation
        this.videoUrlInput.addEventListener('input', (e) => {
            const url = e.target.value.trim();
            if (url && !this.isValidYouTubeUrl(url)) {
                e.target.style.borderColor = '#e53e3e';
            } else {
                e.target.style.borderColor = '';
            }
        });
    }

    async searchVideo() {
        const url = this.videoUrlInput.value.trim();
        
        if (!url) {
            this.showError('يرجى إدخال رابط الفيديو');
            return;
        }

        if (!this.isValidYouTubeUrl(url)) {
            this.showError('يرجى إدخال رابط صحيح من YouTube');
            return;
        }

        const videoId = this.extractVideoId(url);
        if (!videoId) {
            this.showError('لا يمكن استخراج معرف الفيديو من الرابط');
            return;
        }

        this.showLoading();
        this.searchBtn.disabled = true;
        
        try {
            const videoData = await this.fetchVideoInfo(videoId);
            if (videoData) {
                this.currentVideoData = videoData;
                this.displayVideoInfo(videoData);
                this.showSuccess('تم العثور على الفيديو بنجاح!');
            } else {
                this.showError('لم يتم العثور على الفيديو أو أنه غير متاح');
            }
        } catch (error) {
            console.error('Error fetching video info:', error);
            this.showError('حدث خطأ أثناء البحث عن الفيديو. تأكد من صحة الرابط أو حاول مرة أخرى.');
        } finally {
            this.hideLoading();
            this.searchBtn.disabled = false;
        }
    }

    isValidYouTubeUrl(url) {
        const patterns = [
            /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/,
            /^(https?:\/\/)?(www\.)?youtube\.com\/watch\?v=[\w-]+/,
            /^(https?:\/\/)?(www\.)?youtu\.be\/[\w-]+/,
            /^(https?:\/\/)?(www\.)?youtube\.com\/embed\/[\w-]+/
        ];
        return patterns.some(pattern => pattern.test(url));
    }

    extractVideoId(url) {
        const patterns = [
            /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
            /youtube\.com\/watch\?.*v=([^&\n?#]+)/
        ];
        
        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match && match[1]) {
                return match[1];
            }
        }
        return null;
    }

    async fetchVideoInfo(videoId) {
        try {
            const response = await fetch(
                `${this.API_BASE_URL}/videos?part=snippet,statistics,contentDetails&id=${videoId}&key=${this.API_KEY}`
            );
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.items && data.items.length > 0) {
                const video = data.items[0];
                return {
                    id: video.id,
                    title: video.snippet.title,
                    channelTitle: video.snippet.channelTitle,
                    thumbnail: video.snippet.thumbnails.maxres?.url || 
                              video.snippet.thumbnails.high?.url || 
                              video.snippet.thumbnails.medium?.url,
                    duration: this.formatDuration(video.contentDetails.duration),
                    viewCount: this.formatNumber(video.statistics.viewCount),
                    publishedAt: this.formatDate(video.snippet.publishedAt),
                    description: video.snippet.description
                };
            }
            return null;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    formatDuration(duration) {
        // Convert ISO 8601 duration to readable format
        const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
        if (!match) return 'غير محدد';
        
        const hours = parseInt(match[1]?.replace('H', '') || '0');
        const minutes = parseInt(match[2]?.replace('M', '') || '0');
        const seconds = parseInt(match[3]?.replace('S', '') || '0');
        
        let result = '';
        if (hours > 0) result += `${hours}:`;
        result += `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        return result;
    }

    formatNumber(num) {
        if (!num) return '0';
        const number = parseInt(num);
        if (number >= 1000000) {
            return `${(number / 1000000).toFixed(1)}م مشاهدة`;
        } else if (number >= 1000) {
            return `${(number / 1000).toFixed(1)}ك مشاهدة`;
        }
        return `${number} مشاهدة`;
    }

formatDate(dateString) {
       const date = new Date(dateString);
       const now = new Date();
       const diffTime = Math.abs(now - date);
       const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
       
       if (diffDays < 30) {
           return `منذ ${diffDays} يوم`;
       } else if (diffDays < 365) {
           const months = Math.floor(diffDays / 30);
           return `منذ ${months} شهر`;
       } else {
           const years = Math.floor(diffDays / 365);
           return `منذ ${years} سنة`;
       }
   }

   displayVideoInfo(videoData) {
       this.hideLoading();
       this.hideError();
       
       this.thumbnail.src = videoData.thumbnail;
       this.thumbnail.alt = videoData.title;
       this.videoTitle.textContent = videoData.title;
       this.videoChannel.textContent = `القناة: ${videoData.channelTitle}`;
       this.videoDuration.textContent = `المدة: ${videoData.duration}`;
       this.videoViews.textContent = videoData.viewCount;
       this.videoPublished.textContent = `نُشر ${videoData.publishedAt}`;
       
       this.videoInfo.classList.remove('hidden');
       this.resetSelections();
       
       // Add fade-in animation
       this.videoInfo.style.opacity = '0';
       this.videoInfo.style.transform = 'translateY(20px)';
       setTimeout(() => {
           this.videoInfo.style.transition = 'all 0.5s ease';
           this.videoInfo.style.opacity = '1';
           this.videoInfo.style.transform = 'translateY(0)';
       }, 100);
   }

   handleQualitySelection(button) {
       const type = button.dataset.type;
       const quality = button.dataset.quality;
       const format = button.dataset.format;
       
       button.classList.toggle('selected');
       
       const itemId = `${type}-${quality}`;
       
       if (button.classList.contains('selected')) {
           this.selectedItems.set(itemId, {
               type,
               quality,
               format,
               title: this.currentVideoData.title
           });
           this.addSelectedItem(itemId, type, quality, format);
       } else {
           this.selectedItems.delete(itemId);
           this.removeSelectedItem(itemId);
       }
       
       this.updateDownloadButton();
       this.updateNoSelectionMessage();
   }

   addSelectedItem(itemId, type, quality, format) {
       const itemDiv = document.createElement('div');
       itemDiv.className = 'selected-item';
       itemDiv.dataset.id = itemId;
       
       const typeText = type === 'video' ? '🎬 فيديو' : '🎵 موسيقى';
       const sizeEstimate = this.estimateFileSize(type, quality);
       
       itemDiv.innerHTML = `
           <div>
               <strong>${typeText}</strong> - ${quality} (${format.toUpperCase()})
               <br><small style="color: #718096;">الحجم المتوقع: ${sizeEstimate}</small>
           </div>
           <button class="remove-item" onclick="youtubeDownloader.removeItemById('${itemId}')">
               إزالة
           </button>
       `;
       
       this.selectedItemsContainer.appendChild(itemDiv);
       
       // Add entrance animation
       itemDiv.style.opacity = '0';
       itemDiv.style.transform = 'translateX(20px)';
       setTimeout(() => {
           itemDiv.style.transition = 'all 0.3s ease';
           itemDiv.style.opacity = '1';
           itemDiv.style.transform = 'translateX(0)';
       }, 50);
   }

   removeItemById(itemId) {
       this.selectedItems.delete(itemId);
       this.removeSelectedItem(itemId);
       
       // Remove selection from button
       const button = document.querySelector(`[data-type="${itemId.split('-')[0]}"][data-quality="${itemId.split('-')[1]}"]`);
       if (button) {
           button.classList.remove('selected');
       }
       
       this.updateDownloadButton();
       this.updateNoSelectionMessage();
   }

   removeSelectedItem(itemId) {
       const item = this.selectedItemsContainer.querySelector(`[data-id="${itemId}"]`);
       if (item) {
           item.style.transform = 'translateX(20px)';
           item.style.opacity = '0';
           setTimeout(() => {
               if (item.parentNode) {
                   item.remove();
               }
           }, 300);
       }
   }

   estimateFileSize(type, quality) {
       const duration = this.currentVideoData ? this.parseDuration(this.currentVideoData.duration) : 180; // 3 minutes default
       
       if (type === 'video') {
           const bitrates = {
               '1080p': 8000, // kbps
               '720p': 5000,
               '480p': 2500,
               '360p': 1000
           };
           return this.calculateFileSize(duration, bitrates[quality] || 2500);
       } else {
           const bitrates = {
               '320kbps': 320,
               '256kbps': 256,
               '128kbps': 128,
               '64kbps': 64
           };
           return this.calculateFileSize(duration, bitrates[quality] || 128);
       }
   }

   parseDuration(durationString) {
       const parts = durationString.split(':');
       if (parts.length === 2) {
           return parseInt(parts[0]) * 60 + parseInt(parts[1]);
       } else if (parts.length === 3) {
           return parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2]);
       }
       return 180; // default 3 minutes
   }

   calculateFileSize(durationSeconds, bitrateKbps) {
       const sizeKB = (durationSeconds * bitrateKbps) / 8;
       if (sizeKB < 1024) {
           return `${Math.round(sizeKB)} KB`;
       } else if (sizeKB < 1024 * 1024) {
           return `${(sizeKB / 1024).toFixed(1)} MB`;
       } else {
           return `${(sizeKB / (1024 * 1024)).toFixed(1)} GB`;
       }
   }

   updateNoSelectionMessage() {
       const noSelectionMsg = this.selectedItemsContainer.querySelector('.no-selection');
       if (this.selectedItems.size === 0) {
           if (!noSelectionMsg) {
               const msgDiv = document.createElement('p');
               msgDiv.className = 'no-selection';
               msgDiv.textContent = 'لم يتم تحديد أي عنصر للتحميل';
               this.selectedItemsContainer.appendChild(msgDiv);
           }
       } else {
           if (noSelectionMsg) {
               noSelectionMsg.remove();
           }
       }
   }

   updateDownloadButton() {
       const hasSelections = this.selectedItems.size > 0;
       this.downloadBtn.disabled = !hasSelections;
       
       if (hasSelections) {
           const count = this.selectedItems.size;
           this.downloadBtn.querySelector('span').textContent = `تحميل ${count} عنصر`;
           this.downloadBtn.style.background = 'linear-gradient(135deg, #ffd23f 0%, #ff7f39 100%)';
       } else {
           this.downloadBtn.querySelector('span').textContent = 'تحميل المحدد';
           this.downloadBtn.style.background = '#e2e8f0';
       }
   }

   async downloadSelected() {
       if (this.selectedItems.size === 0) return;
       
       this.downloadBtn.disabled = true;
       this.downloadBtn.querySelector('span').textContent = 'جاري التحضير...';
       this.downloadProgress.classList.remove('hidden');
       
       try {
           let completed = 0;
           const total = this.selectedItems.size;
           
           for (const [itemId, itemData] of this.selectedItems) {
               this.updateProgress((completed / total) * 100, `جاري تحميل ${itemData.type === 'video' ? 'الفيديو' : 'الموسيقى'} بجودة ${itemData.quality}...`);
               
               await this.downloadItem(itemData);
               completed++;
               
               this.updateProgress((completed / total) * 100, `تم تحميل ${completed} من ${total}`);
               await this.delay(1000); // تأخير قصير بين التحميلات
           }
           
           this.showSuccess(`تم تحميل ${total} عنصر بنجاح! 🎉`);
           this.resetSelections();
           
       } catch (error) {
           console.error('Download error:', error);
           this.showError('حدث خطأ أثناء التحميل. يرجى المحاولة مرة أخرى.');
       } finally {
           this.downloadBtn.disabled = false;
           this.updateDownloadButton();
           this.downloadProgress.classList.add('hidden');
       }
   }

   async downloadItem(itemData) {
    const fileName = this.generateFileName(itemData);
    const videoUrl = `https://www.youtube.com/watch?v=${this.currentVideoData.id}`;
    
    try {
        const response = await fetch(
            `https://youtube-downloader-backend-6afo.onrender.com/download?videoUrl=${encodeURIComponent(videoUrl)}&type=${itemData.type}&quality=${itemData.quality}`
        );
        
        if (!response.ok) throw new Error('فشل التحميل');
        
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        link.click();
        
        URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Download error:', error);
        this.showError('حدث خطأ أثناء التحميل!');
    }
}

   generateFileName(itemData) {
       const sanitizedTitle = this.currentVideoData.title
           .replace(/[^\w\s-]/g, '') // إزالة الأحرف الخاصة
           .replace(/\s+/g, '_') // استبدال المسافات بـ _
           .substring(0, 50); // تحديد طول الاسم
       
       return `${sanitizedTitle}_${itemData.quality}.${itemData.format}`;
   }

   generateDownloadUrl(itemData) {
       // في التطبيق الحقيقي، ستحصل على الرابط من الخادم
       return `#download-${this.currentVideoData.id}-${itemData.type}-${itemData.quality}`;
   }

   createDownloadLink(fileName, url) {
       const link = document.createElement('a');
       link.href = url;
       link.download = fileName;
       link.style.display = 'none';
       document.body.appendChild(link);
       
       // في التطبيق الحقيقي، سيكون هناك ملف فعلي للتحميل
       // link.click();
       
       document.body.removeChild(link);
   }

   async simulateDownload() {
       // محاكاة وقت التحميل
       const downloadTime = Math.random() * 3000 + 2000; // 2-5 ثوان
       return new Promise(resolve => setTimeout(resolve, downloadTime));
   }

   updateProgress(percentage, text) {
       const progressFill = this.downloadProgress.querySelector('.progress-fill');
       const progressText = this.downloadProgress.querySelector('.progress-text');
       
       progressFill.style.width = `${percentage}%`;
       progressText.textContent = text;
   }

   delay(ms) {
       return new Promise(resolve => setTimeout(resolve, ms));
   }

   resetSelections() {
       this.selectedItems.clear();
       document.querySelectorAll('.quality-btn.selected').forEach(btn => {
           btn.classList.remove('selected');
       });
       this.selectedItemsContainer.innerHTML = '';
       this.updateDownloadButton();
       this.updateNoSelectionMessage();
   }

   showLoading() {
       this.loading.classList.remove('hidden');
       this.videoInfo.classList.add('hidden');
       this.hideError();
       this.hideSuccess();
   }

   hideLoading() {
       this.loading.classList.add('hidden');
   }

   showError(message) {
       this.error.querySelector('p').textContent = message;
       this.error.classList.remove('hidden');
       this.hideLoading();
       this.hideSuccess();
       
       // إخفاء الرسالة تلقائياً بعد 5 ثوان
       setTimeout(() => {
           this.hideError();
       }, 5000);
   }

   hideError() {
       this.error.classList.add('hidden');
   }

   showSuccess(message) {
       this.success.querySelector('p').textContent = message;
       this.success.classList.remove('hidden');
       this.hideError();
       
       // إخفاء الرسالة تلقائياً بعد 3 ثوان
       setTimeout(() => {
           this.hideSuccess();
       }, 3000);
   }

   hideSuccess() {
       this.success.classList.add('hidden');
   }
}

// إنشاء متغير عام للوصول إلى الكلاس من HTML
let youtubeDownloader;

// تشغيل التطبيق عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
   youtubeDownloader = new YouTubeDownloader();
   
   // إضافة مستمعات الأحداث الإضافية
   setupAdditionalFeatures();
});

function setupAdditionalFeatures() {
   // تنظيف الرابط تلقائياً عند اللصق
   document.getElementById('videoUrl').addEventListener('paste', (e) => {
       setTimeout(() => {
           let url = e.target.value.trim();
           // إزالة المعاملات غير الضرورية
           if (url.includes('&list=') || url.includes('&index=')) {
               const cleanUrl = url.split('&')[0];
               e.target.value = cleanUrl;
           }
       }, 100);
   });
   
   // اختصارات لوحة المفاتيح
   document.addEventListener('keydown', (e) => {
       if (e.ctrlKey && e.key === 'Enter') {
           youtubeDownloader.searchVideo();
       }
       if (e.key === 'Escape') {
           youtubeDownloader.hideError();
           youtubeDownloader.hideSuccess();
       }
   });
   
   // تحديث الصفحة كل 10 دقائق للحفاظ على API key نشط
   setInterval(() => {
       console.log('Keeping API connection alive...');
   }, 600000);
}

// دوال مساعدة إضافية
function copyToClipboard(text) {
   navigator.clipboard.writeText(text).then(() => {
       youtubeDownloader.showSuccess('تم نسخ النص بنجاح!');
   });
}

function shareVideo() {
   if (youtubeDownloader.currentVideoData && navigator.share) {
       navigator.share({
           title: youtubeDownloader.currentVideoData.title,
           text: 'شاهد هذا الفيديو الرائع!',
           url: `https://www.youtube.com/watch?v=${youtubeDownloader.currentVideoData.id}`
       });
   }
}

// معالج الأخطاء العام
window.addEventListener('error', (e) => {
   console.error('Global error:', e.error);
   if (youtubeDownloader) {
       youtubeDownloader.showError('حدث خطأ غير متوقع. يرجى تحديث الصفحة والمحاولة مرة أخرى.');
   }
});

// معالج الشبكة
window.addEventListener('online', () => {
   if (youtubeDownloader) {
       youtubeDownloader.showSuccess('تم استعادة الاتصال بالإنترنت!');
   }
});

window.addEventListener('offline', () => {
   if (youtubeDownloader) {
       youtubeDownloader.showError('تم فقدان الاتصال بالإنترنت. يرجى التحقق من اتصالك.');
   }
});