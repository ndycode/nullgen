/**
 * Image Toolkit - Multi-Tool Suite
 * EXIF Stripper, Bulk Resizer, Format Converter, Compressor, EXIF Viewer
 */

class ImageToolkit {
    constructor() {
        this.currentTool = 'stripper';
        this.tools = {
            stripper: { files: [], settings: { quality: 0.9, randomExif: false, safetyCrop: false } },
            resizer: { files: [], settings: { width: null, height: null, lockRatio: true, preset: 'custom' } },
            cropper: { files: [], settings: { quality: 0.9 } },
            randomcrop: { files: [], settings: { maxPercent: 4, quality: 0.9 } },
            converter: { files: [], settings: { format: 'jpeg', quality: 0.9 } },
            compressor: { files: [], settings: { level: 0.75, maxWidth: null } },
            viewer: { file: null }
        };

        this.deviceData = [
            { make: 'Apple', model: 'iPhone 15 Pro Max', software: 'iOS 17.2', lens: 'iPhone 15 Pro Max back triple camera 6.765mm f/1.78' },
            { make: 'Apple', model: 'iPhone 14 Pro', software: 'iOS 16.6', lens: 'iPhone 14 Pro back triple camera 6.86mm f/1.78' },
            { make: 'Apple', model: 'iPhone 13', software: 'iOS 16.4', lens: 'iPhone 13 back dual wide camera 5.1mm f/1.6' },
            { make: 'Samsung', model: 'SM-S928B', software: 'S928BXXU1AWL1', lens: 'Samsung S928B' },
            { make: 'Samsung', model: 'SM-S918B', software: 'S918BXXU2BWK1', lens: 'Samsung S918B' },
            { make: 'Google', model: 'Pixel 8 Pro', software: 'AP2A.240805.005', lens: 'Pixel 8 Pro back camera 6.9mm f/1.68' },
            { make: 'Google', model: 'Pixel 7', software: 'AP1A.240405.002', lens: 'Pixel 7 back camera 6.81mm f/1.89' },
            { make: 'Xiaomi', model: '2312DRA50G', software: 'V14.0.8.0.TLGMIXM', lens: 'Xiaomi 13T Pro' },
            { make: 'OPPO', model: 'CPH2519', software: 'CPH2519_13.1.0.500', lens: 'OPPO Reno 10 Pro+' },
            { make: 'OnePlus', model: 'CPH2449', software: 'CPH2449_13.1.0.582', lens: 'OnePlus 11 5G' }
        ];

        this.init();
    }

    init() {
        this.bindNavigation();
        this.bindDropZones();
        this.bindSettings();
        this.bindProcessButtons();
    }

    // Navigation
    bindNavigation() {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', () => {
                const tool = item.dataset.tool;
                this.switchTool(tool);
            });
        });
    }

    switchTool(tool) {
        this.currentTool = tool;

        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        document.querySelector(`[data-tool="${tool}"]`).classList.add('active');

        document.querySelectorAll('.tool-panel').forEach(p => p.classList.remove('active'));
        document.getElementById(`tool-${tool}`).classList.add('active');
    }

    // Drop Zones (full screen)
    bindDropZones() {
        document.querySelectorAll('.drop-zone').forEach(zone => {
            const input = zone.querySelector('input[type="file"]');
            const tool = zone.dataset.tool;

            zone.addEventListener('click', () => input.click());
            input.addEventListener('change', e => this.addFiles(tool, e.target.files));
        });

        // Full screen drag & drop
        document.addEventListener('dragover', e => {
            e.preventDefault();
            const activeZone = document.querySelector('.tool-panel.active .drop-zone');
            if (activeZone) activeZone.classList.add('active');
        });

        document.addEventListener('dragleave', e => {
            if (!e.relatedTarget) {
                document.querySelectorAll('.drop-zone').forEach(z => z.classList.remove('active'));
            }
        });

        document.addEventListener('drop', e => {
            e.preventDefault();
            document.querySelectorAll('.drop-zone').forEach(z => z.classList.remove('active'));
            this.addFiles(this.currentTool, e.dataTransfer.files);
        });
    }

    addFiles(tool, fileList) {
        const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/bmp'];
        const files = Array.from(fileList).filter(f => validTypes.includes(f.type));

        if (tool === 'viewer') {
            if (files.length > 0) {
                this.tools.viewer.file = files[0];
                this.analyzeExif(files[0]);
            }
        } else {
            this.tools[tool].files.push(...files);
        }

        this.updateUI(tool);
    }

    updateUI(tool) {
        const panel = document.getElementById(`tool-${tool}`);
        const count = tool === 'viewer' ? (this.tools.viewer.file ? 1 : 0) : this.tools[tool].files.length;
        const fileCountEl = panel.querySelector('.file-count');
        const btn = panel.querySelector('.process-btn');

        fileCountEl.textContent = count ? `${count} image${count > 1 ? 's' : ''} selected` : '';
        if (btn) btn.disabled = count === 0;

        panel.querySelector('.status').textContent = '';
    }

    // Settings
    bindSettings() {
        // Stripper
        this.bindRangeSlider('stripper-quality', val => this.tools.stripper.settings.quality = val / 100);
        this.bindToggle('stripper-random', val => this.tools.stripper.settings.randomExif = val);
        this.bindToggle('stripper-crop', val => this.tools.stripper.settings.safetyCrop = val);

        // Resizer
        const presetSelect = document.getElementById('resizer-preset');
        const widthInput = document.getElementById('resizer-width');
        const heightInput = document.getElementById('resizer-height');

        presetSelect?.addEventListener('change', e => {
            const val = e.target.value;
            this.tools.resizer.settings.preset = val;
            if (val !== 'custom') {
                const [w, h] = val.split('x').map(Number);
                widthInput.value = w;
                heightInput.value = h;
                this.tools.resizer.settings.width = w;
                this.tools.resizer.settings.height = h;
            }
        });

        widthInput?.addEventListener('input', e => {
            this.tools.resizer.settings.width = e.target.value ? parseInt(e.target.value) : null;
            presetSelect.value = 'custom';
        });

        heightInput?.addEventListener('input', e => {
            this.tools.resizer.settings.height = e.target.value ? parseInt(e.target.value) : null;
            presetSelect.value = 'custom';
        });

        this.bindToggle('resizer-lock', val => this.tools.resizer.settings.lockRatio = val);

        // Random Cropper
        this.bindRangeSlider('randomcrop-amount', val => this.tools.randomcrop.settings.maxPercent = val);

        // Converter
        document.getElementById('converter-format')?.addEventListener('change', e => {
            this.tools.converter.settings.format = e.target.value;
        });
        this.bindRangeSlider('converter-quality', val => this.tools.converter.settings.quality = val / 100);

        // Compressor
        this.bindRangeSlider('compressor-level', val => this.tools.compressor.settings.level = val / 100);
        document.getElementById('compressor-maxwidth')?.addEventListener('input', e => {
            this.tools.compressor.settings.maxWidth = e.target.value ? parseInt(e.target.value) : null;
        });
    }

    bindRangeSlider(id, callback) {
        const input = document.getElementById(id);
        if (!input) return;
        const span = input.parentElement.querySelector('span');
        input.addEventListener('input', e => {
            span.textContent = `${e.target.value}%`;
            callback(parseInt(e.target.value));
        });
    }

    bindToggle(id, callback) {
        const btn = document.getElementById(id);
        if (!btn) return;
        btn.addEventListener('click', () => {
            const active = !btn.classList.contains('active');
            btn.classList.toggle('active', active);
            btn.textContent = active ? 'ON' : 'OFF';
            callback(active);
        });
    }

    // Process Buttons
    bindProcessButtons() {
        document.querySelectorAll('.process-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const panel = btn.closest('.tool-panel');
                const tool = panel.id.replace('tool-', '');
                this.processTool(tool);
            });
        });
    }

    async processTool(tool) {
        const panel = document.getElementById(`tool-${tool}`);
        const btn = panel.querySelector('.process-btn');
        const progress = btn.querySelector('.btn-progress');
        const status = panel.querySelector('.status');
        const files = this.tools[tool].files;

        if (files.length === 0) return;

        btn.disabled = true;
        btn.querySelector('.btn-text').textContent = 'Processing...';

        const results = [];
        const usedNames = new Set();
        let totalOriginal = 0;
        let totalCompressed = 0;

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            totalOriginal += file.size;

            try {
                let blob;
                let ext;

                switch (tool) {
                    case 'stripper':
                        blob = await this.processStripper(file);
                        ext = 'jpg';
                        break;
                    case 'resizer':
                        blob = await this.processResizer(file);
                        ext = 'jpg';
                        break;
                    case 'cropper':
                        blob = await this.processCropper(file);
                        ext = 'jpg';
                        break;
                    case 'randomcrop':
                        blob = await this.processRandomCrop(file);
                        ext = 'jpg';
                        break;
                    case 'converter':
                        blob = await this.processConverter(file);
                        ext = this.tools.converter.settings.format === 'jpeg' ? 'jpg' : this.tools.converter.settings.format;
                        break;
                    case 'compressor':
                        blob = await this.processCompressor(file);
                        ext = 'jpg';
                        break;
                }

                totalCompressed += blob.size;
                const baseName = this.stripToolSuffixes(file.name.replace(/\.[^/.]+$/, ''));
                const name = this.ensureUniqueName(`${baseName}.${ext}`, usedNames);
                results.push({ blob, name });

            } catch (err) {
                console.error(`Error processing ${file.name}:`, err);
            }

            progress.style.width = `${((i + 1) / files.length) * 100}%`;
        }

        // Download ZIP
        await this.downloadZip(results, tool);

        // Show stats for compressor
        if (tool === 'compressor') {
            const statsPanel = document.getElementById('compressor-stats');
            statsPanel.style.display = 'flex';
            document.getElementById('stat-original').textContent = this.formatSize(totalOriginal);
            document.getElementById('stat-compressed').textContent = this.formatSize(totalCompressed);
            document.getElementById('stat-saved').textContent = `${Math.round((1 - totalCompressed / totalOriginal) * 100)}%`;
        }

        // Reset
        this.tools[tool].files = [];
        progress.style.width = '0%';
        btn.querySelector('.btn-text').textContent = btn.querySelector('.btn-text').textContent.replace('Processing...', '⚡ Process');
        this.updateUI(tool);

        status.textContent = `✓ ${results.length} images processed and downloaded`;
        status.className = 'status success';

        // Reset button text
        const btnTexts = {
            cropper: 'Crop to 1:1 & Download ZIP',
            randomcrop: 'Random Crop & Download ZIP',
            stripper: '⚡ Process & Download ZIP',
            resizer: '⚡ Resize & Download ZIP',
            converter: '⚡ Convert & Download ZIP',
            compressor: '⚡ Compress & Download ZIP'
        };
        btn.querySelector('.btn-text').textContent = btnTexts[tool];
    }

    // Tool Processors
    async processStripper(file) {
        let blob = await this.stripExif(file, this.tools.stripper.settings);
        if (this.tools.stripper.settings.randomExif) {
            blob = await this.injectExif(blob);
        }
        return blob;
    }

    // ... (keeping other process functions same)

    async processResizer(file) {
        const { width, height, lockRatio } = this.tools.resizer.settings;
        return this.resizeImage(file, width, height, lockRatio);
    }

    async processCropper(file) {
        const { quality } = this.tools.cropper.settings;
        return this.cropToSquare(file, quality);
    }

    async processRandomCrop(file) {
        const { maxPercent, quality } = this.tools.randomcrop.settings;
        return this.randomCropImage(file, maxPercent, quality);
    }

    async processConverter(file) {
        const { format, quality } = this.tools.converter.settings;
        return this.convertFormat(file, format, quality);
    }

    async processCompressor(file) {
        const { level, maxWidth } = this.tools.compressor.settings;
        return this.compressImage(file, level, maxWidth);
    }

    // Core Image Functions
    stripExif(file, settings) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                // Calculate Dimensions
                let sx = 0, sy = 0, sWidth = img.width, sHeight = img.height;
                
                // Logic: Safety Crop (1-5%)
                if (settings.safetyCrop) {
                    const cropPercent = (Math.floor(Math.random() * 4) + 1) / 100; // 1% to 5%
                    const cropW = Math.floor(img.width * cropPercent);
                    const cropH = Math.floor(img.height * cropPercent);
                    
                    sx = Math.floor(Math.random() * cropW);
                    sy = Math.floor(Math.random() * cropH);
                    sWidth = img.width - cropW;
                    sHeight = img.height - cropH;
                }

                const canvas = document.createElement('canvas');
                canvas.width = sWidth;
                canvas.height = sHeight;
                const ctx = canvas.getContext('2d');
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                
                // Draw cropped portion
                ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, sWidth, sHeight);

                // Add pixel noise (Anti-Hash)
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const data = imageData.data;
                const pixelsToModify = Math.floor(data.length / 4 * 0.001);
                for (let i = 0; i < pixelsToModify; i++) {
                    const px = Math.floor(Math.random() * (data.length / 4)) * 4;
                    const ch = Math.floor(Math.random() * 3);
                    data[px + ch] = Math.max(0, Math.min(255, data[px + ch] + (Math.random() > 0.5 ? 1 : -1)));
                }
                ctx.putImageData(imageData, 0, 0);

                canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Failed')), 'image/jpeg', settings.quality);
                URL.revokeObjectURL(img.src);
            };
            img.onerror = () => reject(new Error('Load failed'));
            img.src = URL.createObjectURL(file);
        });
    }

    resizeImage(file, targetWidth, targetHeight, lockRatio) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = async () => {
                try {
                    let w = targetWidth || img.width;
                    let h = targetHeight || img.height;

                    if (lockRatio) {
                        if (targetWidth && !targetHeight) {
                            h = Math.round(img.height * (targetWidth / img.width));
                        } else if (targetHeight && !targetWidth) {
                            w = Math.round(img.width * (targetHeight / img.height));
                        } else if (targetWidth && targetHeight) {
                            const ratio = Math.min(targetWidth / img.width, targetHeight / img.height);
                            w = Math.round(img.width * ratio);
                            h = Math.round(img.height * ratio);
                        }
                    }

                    const canvas = document.createElement('canvas');
                    canvas.width = w;
                    canvas.height = h;
                    const ctx = canvas.getContext('2d');
                    ctx.fillStyle = '#FFFFFF';
                    ctx.fillRect(0, 0, w, h);
                    ctx.drawImage(img, 0, 0, w, h);

                    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
                    const withExif = await this.preserveExifDataUrl(file, dataUrl);
                    resolve(this.dataUrlToBlob(withExif));
                } catch (err) {
                    reject(err);
                } finally {
                    URL.revokeObjectURL(img.src);
                }
            };
            img.onerror = () => reject(new Error('Load failed'));
            img.src = URL.createObjectURL(file);
        });
    }

    cropToSquare(file, quality) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = async () => {
                try {
                    const size = Math.min(img.width, img.height);
                    const sx = Math.floor((img.width - size) / 2);
                    const sy = Math.floor((img.height - size) / 2);

                    const canvas = document.createElement('canvas');
                    canvas.width = size;
                    canvas.height = size;
                    const ctx = canvas.getContext('2d');
                    ctx.fillStyle = '#FFFFFF';
                    ctx.fillRect(0, 0, size, size);
                    ctx.drawImage(img, sx, sy, size, size, 0, 0, size, size);

                    const dataUrl = canvas.toDataURL('image/jpeg', quality);
                    const withExif = await this.preserveExifDataUrl(file, dataUrl);
                    resolve(this.dataUrlToBlob(withExif));
                } catch (err) {
                    reject(err);
                } finally {
                    URL.revokeObjectURL(img.src);
                }
            };
            img.onerror = () => reject(new Error('Load failed'));
            img.src = URL.createObjectURL(file);
        });
    }

    randomCropImage(file, maxPercent, quality) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = async () => {
                try {
                    const safeMax = Math.max(1, Math.min(20, Math.round(maxPercent)));
                    const cropPercent = this.randomInt(1, safeMax) / 100;

                    const cropW = Math.max(1, Math.floor(img.width * (1 - cropPercent)));
                    const cropH = Math.max(1, Math.floor(img.height * (1 - cropPercent)));
                    const maxOffsetX = Math.max(0, img.width - cropW);
                    const maxOffsetY = Math.max(0, img.height - cropH);
                    const sx = this.randomInt(0, maxOffsetX);
                    const sy = this.randomInt(0, maxOffsetY);

                    const canvas = document.createElement('canvas');
                    canvas.width = cropW;
                    canvas.height = cropH;
                    const ctx = canvas.getContext('2d');
                    ctx.fillStyle = '#FFFFFF';
                    ctx.fillRect(0, 0, cropW, cropH);
                    ctx.drawImage(img, sx, sy, cropW, cropH, 0, 0, cropW, cropH);

                    const dataUrl = canvas.toDataURL('image/jpeg', quality);
                    const withExif = await this.preserveExifDataUrl(file, dataUrl);
                    resolve(this.dataUrlToBlob(withExif));
                } catch (err) {
                    reject(err);
                } finally {
                    URL.revokeObjectURL(img.src);
                }
            };
            img.onerror = () => reject(new Error('Load failed'));
            img.src = URL.createObjectURL(file);
        });
    }

    convertFormat(file, format, quality) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = async () => {
                try {
                    const canvas = document.createElement('canvas');
                    canvas.width = img.width;
                    canvas.height = img.height;
                    const ctx = canvas.getContext('2d');

                    if (format === 'jpeg') {
                        ctx.fillStyle = '#FFFFFF';
                        ctx.fillRect(0, 0, canvas.width, canvas.height);
                    }
                    ctx.drawImage(img, 0, 0);

                    const mimeType = `image/${format}`;
                    if (mimeType === 'image/jpeg') {
                        const dataUrl = canvas.toDataURL(mimeType, quality);
                        const withExif = await this.preserveExifDataUrl(file, dataUrl);
                        resolve(this.dataUrlToBlob(withExif));
                    } else {
                        canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Failed')), mimeType, quality);
                    }
                } catch (err) {
                    reject(err);
                } finally {
                    URL.revokeObjectURL(img.src);
                }
            };
            img.onerror = () => reject(new Error('Load failed'));
            img.src = URL.createObjectURL(file);
        });
    }

    compressImage(file, level, maxWidth) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = async () => {
                try {
                    let w = img.width;
                    let h = img.height;

                    if (maxWidth && w > maxWidth) {
                        h = Math.round(h * (maxWidth / w));
                        w = maxWidth;
                    }

                    const canvas = document.createElement('canvas');
                    canvas.width = w;
                    canvas.height = h;
                    const ctx = canvas.getContext('2d');
                    ctx.fillStyle = '#FFFFFF';
                    ctx.fillRect(0, 0, w, h);
                    ctx.drawImage(img, 0, 0, w, h);

                    const dataUrl = canvas.toDataURL('image/jpeg', level);
                    const withExif = await this.preserveExifDataUrl(file, dataUrl);
                    resolve(this.dataUrlToBlob(withExif));
                } catch (err) {
                    reject(err);
                } finally {
                    URL.revokeObjectURL(img.src);
                }
            };
            img.onerror = () => reject(new Error('Load failed'));
            img.src = URL.createObjectURL(file);
        });
    }

    async injectExif(blob) {
        try {
            const dataUrl = await this.blobToDataUrl(blob);
            const device = this.deviceData[Math.floor(Math.random() * this.deviceData.length)];

            const now = new Date();
            const randomDays = Math.floor(Math.random() * 60);
            const randomHours = Math.floor(Math.random() * 14) + 7;
            const photoDate = new Date(now - randomDays * 24 * 60 * 60 * 1000);
            photoDate.setHours(randomHours, Math.floor(Math.random() * 60), Math.floor(Math.random() * 60));
            const dateStr = photoDate.toISOString().replace('T', ' ').replace(/\.\d{3}Z$/, '').replace(/-/g, ':');
            const subsec = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
            const uniqueId = Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('');

            const isoValues = [50, 100, 200, 400, 800];
            const iso = isoValues[Math.floor(Math.random() * isoValues.length)];
            const fNumber = [[16, 10], [18, 10], [20, 10], [22, 10]][Math.floor(Math.random() * 4)];
            const exposureTime = [[1, 100], [1, 250], [1, 500], [1, 1000]][Math.floor(Math.random() * 4)];

            const exifObj = {
                "0th": {
                    [piexif.ImageIFD.Make]: device.make,
                    [piexif.ImageIFD.Model]: device.model,
                    [piexif.ImageIFD.Software]: device.software,
                    [piexif.ImageIFD.DateTime]: dateStr,
                    [piexif.ImageIFD.Orientation]: 1
                },
                "Exif": {
                    [piexif.ExifIFD.DateTimeOriginal]: dateStr,
                    [piexif.ExifIFD.DateTimeDigitized]: dateStr,
                    [piexif.ExifIFD.SubSecTimeOriginal]: subsec,
                    [piexif.ExifIFD.ExposureTime]: exposureTime,
                    [piexif.ExifIFD.FNumber]: fNumber,
                    [piexif.ExifIFD.ISOSpeedRatings]: iso,
                    [piexif.ExifIFD.LensMake]: device.make,
                    [piexif.ExifIFD.LensModel]: device.lens,
                    [piexif.ExifIFD.ImageUniqueID]: uniqueId
                }
            };

            const exifBytes = piexif.dump(exifObj);
            const newDataUrl = piexif.insert(exifBytes, dataUrl);
            return this.dataUrlToBlob(newDataUrl);
        } catch (err) {
            console.error('EXIF injection failed:', err);
            return blob;
        }
    }

    // EXIF Viewer
    analyzeExif(file) {
        const resultsDiv = document.getElementById('exif-results');
        const previewImg = document.getElementById('exif-image');

        previewImg.src = URL.createObjectURL(file);
        resultsDiv.style.display = 'grid';

        // Clear previous
        ['exif-camera', 'exif-datetime', 'exif-location', 'exif-settings', 'exif-all'].forEach(id => {
            document.getElementById(id).innerHTML = '';
        });

        EXIF.getData(file, function () {
            const allTags = EXIF.getAllTags(this);

            // Camera Info
            const cameraData = [
                ['Make', allTags.Make],
                ['Model', allTags.Model],
                ['Software', allTags.Software],
                ['Lens', allTags.LensModel || allTags.LensMake]
            ].filter(([, v]) => v);

            document.getElementById('exif-camera').innerHTML = cameraData.length
                ? cameraData.map(([k, v]) => `<div class="exif-row"><span class="exif-key">${k}</span><span class="exif-value">${v}</span></div>`).join('')
                : '<div class="exif-empty">No camera info found</div>';

            // Date/Time
            const dateData = [
                ['Date Taken', allTags.DateTimeOriginal],
                ['Date Digitized', allTags.DateTimeDigitized],
                ['Modified', allTags.DateTime]
            ].filter(([, v]) => v);

            document.getElementById('exif-datetime').innerHTML = dateData.length
                ? dateData.map(([k, v]) => `<div class="exif-row"><span class="exif-key">${k}</span><span class="exif-value">${v}</span></div>`).join('')
                : '<div class="exif-empty">No date info found</div>';

            // Location
            const lat = allTags.GPSLatitude;
            const lon = allTags.GPSLongitude;
            let locationHtml = '<div class="exif-empty">No GPS data found</div>';
            if (lat && lon) {
                const latDec = lat[0] + lat[1] / 60 + lat[2] / 3600;
                const lonDec = lon[0] + lon[1] / 60 + lon[2] / 3600;
                locationHtml = `
                    <div class="exif-row"><span class="exif-key">Latitude</span><span class="exif-value">${latDec.toFixed(6)}° ${allTags.GPSLatitudeRef}</span></div>
                    <div class="exif-row"><span class="exif-key">Longitude</span><span class="exif-value">${lonDec.toFixed(6)}° ${allTags.GPSLongitudeRef}</span></div>
                `;
            }
            document.getElementById('exif-location').innerHTML = locationHtml;

            // Settings
            const settingsData = [
                ['ISO', allTags.ISOSpeedRatings],
                ['Aperture', allTags.FNumber ? `f/${allTags.FNumber}` : null],
                ['Shutter', allTags.ExposureTime ? `1/${Math.round(1 / allTags.ExposureTime)}s` : null],
                ['Focal Length', allTags.FocalLength ? `${allTags.FocalLength}mm` : null],
                ['Flash', allTags.Flash !== undefined ? (allTags.Flash ? 'Yes' : 'No') : null],
                ['White Balance', allTags.WhiteBalance === 0 ? 'Auto' : allTags.WhiteBalance === 1 ? 'Manual' : null]
            ].filter(([, v]) => v !== null && v !== undefined);

            document.getElementById('exif-settings').innerHTML = settingsData.length
                ? settingsData.map(([k, v]) => `<div class="exif-row"><span class="exif-key">${k}</span><span class="exif-value">${v}</span></div>`).join('')
                : '<div class="exif-empty">No camera settings found</div>';

            // All Metadata
            const allHtml = Object.entries(allTags)
                .filter(([, v]) => v !== undefined && typeof v !== 'object')
                .map(([k, v]) => `<div class="exif-row"><span class="exif-key">${k}</span><span class="exif-value">${v}</span></div>`)
                .join('');

            document.getElementById('exif-all').innerHTML = allHtml || '<div class="exif-empty">No metadata found</div>';
        });
    }

    // Utilities
    async downloadZip(blobs, toolName) {
        const zip = new JSZip();
        for (const { blob, name } of blobs) {
            zip.file(name, blob);
        }
        const zipBlob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } });
        const url = URL.createObjectURL(zipBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${toolName}_${Date.now()}.zip`;
        link.click();
        URL.revokeObjectURL(url);
    }

    blobToDataUrl(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }

    dataUrlToBlob(dataUrl) {
        const arr = dataUrl.split(',');
        const mime = arr[0].match(/:(.*?);/)[1];
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) u8arr[n] = bstr.charCodeAt(n);
        return new Blob([u8arr], { type: mime });
    }

    ensureUniqueName(name, usedNames) {
        if (!usedNames.has(name)) {
            usedNames.add(name);
            return name;
        }
        const dotIndex = name.lastIndexOf('.');
        const base = dotIndex > 0 ? name.slice(0, dotIndex) : name;
        const ext = dotIndex > 0 ? name.slice(dotIndex) : '';
        let counter = 2;
        let candidate = `${base}_${counter}${ext}`;
        while (usedNames.has(candidate)) {
            counter += 1;
            candidate = `${base}_${counter}${ext}`;
        }
        usedNames.add(candidate);
        return candidate;
    }

    stripToolSuffixes(name) {
        let cleaned = name;
        const suffixRegex = /_(stripper|resizer|cropper|randomcrop|converter|compressor)$/i;
        while (suffixRegex.test(cleaned)) {
            cleaned = cleaned.replace(suffixRegex, '');
        }
        return cleaned;
    }

    async preserveExifDataUrl(sourceFile, targetDataUrl) {
        const isJpeg = sourceFile.type === 'image/jpeg' || sourceFile.type === 'image/jpg';
        if (!isJpeg || typeof piexif === 'undefined') return targetDataUrl;
        try {
            const originalDataUrl = await this.blobToDataUrl(sourceFile);
            const exifData = piexif.load(originalDataUrl);
            const exifBytes = piexif.dump(exifData);
            return piexif.insert(exifBytes, targetDataUrl);
        } catch (err) {
            console.warn('EXIF copy failed:', err);
            return targetDataUrl;
        }
    }

    randomInt(min, max) {
        const safeMin = Math.ceil(min);
        const safeMax = Math.floor(max);
        if (safeMax <= safeMin) return safeMin;
        return Math.floor(Math.random() * (safeMax - safeMin + 1)) + safeMin;
    }

    formatSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';      
        return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    }
}

document.addEventListener('DOMContentLoaded', () => new ImageToolkit());
