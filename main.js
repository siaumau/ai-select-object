     // 获取DOM元素
     const imageInput = document.getElementById('imageInput');
     const detectButton = document.getElementById('detectButton');
     const errorMessage = document.getElementById('errorMessage');
     const imageContainer = document.getElementById('imageContainer');
     const uploadedImage = document.getElementById('uploadedImage');
     const detectionCanvas = document.getElementById('detectionCanvas');
     const resultsContainer = document.getElementById('resultsContainer');
     const resultsTableBody = document.getElementById('resultsTableBody');
     
     // 存储上传的图片文件
     let currentImage = null;
     
     // 处理图片上传
     imageInput.addEventListener('change', function(e) {
         const file = e.target.files[0];
         if (file) {
             const reader = new FileReader();
             reader.onload = function(e) {
                 // 显示图片
                 uploadedImage.src = e.target.result;
                 imageContainer.classList.remove('hidden');
                 
                 // 保存文件引用
                 currentImage = file;
                 
                 // 启用检测按钮
                 detectButton.disabled = false;
                 
                 // 清除之前的结果
                 clearResults();
             };
             reader.readAsDataURL(file);
         }
     });
     
     // 发起物体检测
     detectButton.addEventListener('click', function() {
         if (!currentImage) {
             showError("請先上傳圖片");
             return;
         }
         
         // 显示加载状态
         detectButton.textContent = '檢測中...';
         detectButton.disabled = true;
         hideError();
         
         // 将图片转换为base64格式
         const reader = new FileReader();
         reader.readAsDataURL(currentImage);
         reader.onloadend = function() {
             // 获取Base64编码（去除头部的data:image/jpeg;base64,）
             const base64data = reader.result.split(',')[1];
             
             // 调用API进行物体检测
             detectObjects(base64data);
         };
     });
     
     // 调用OpenRouter API进行物体检测
     function detectObjects(base64Image) {
         // 使用本地代理伺服器
         const proxyUrl = 'http://localhost:4001/api/detect';
         
         // 顯示加載狀態
         showError("正在處理圖片...");
         
         // 發送請求到代理伺服器
         fetch(proxyUrl, {
             method: 'POST',
             headers: {
                 'Content-Type': 'application/json'
             },
             body: JSON.stringify({
                 image: base64Image,
                 detect_classes: ['person', 'car', 'building', 'object']
             })
         })
         .then(response => {
             if (!response.ok) {
                 throw new Error(`請求失敗: ${response.status}`);
             }
             return response.json();
         })
         .then(data => {
             // 處理檢測結果
             const detections = data.detections || [];
             if (detections.length > 0) {
                 // 繪製檢測框和標籤
                 drawDetections(detections);
                 
                 // 顯示檢測結果列表
                 displayResultsList(detections);
                 // 清除錯誤訊息
                 hideError();
             } else {
                 showError("未檢測到任何物體");
             }
         })
         .catch(error => {
             console.error('Error:', error);
             showError(`檢測失敗: ${error.message}`);
         })
         .finally(() => {
             // 恢復按鈕狀態
             detectButton.textContent = '開始鑑測物件';
             detectButton.disabled = false;
         });
     }
     
     // 在Canvas上绘制检测框和标签
     function drawDetections(detections) {
         if (!detectionCanvas || !uploadedImage) return;
         
         const canvas = detectionCanvas;
         const ctx = canvas.getContext('2d');
         const img = uploadedImage;
         
         // 确保图片已加载
         if (img.complete) {
             setupCanvasAndDraw();
         } else {
             img.onload = setupCanvasAndDraw;
         }
         
         function setupCanvasAndDraw() {
             // 设置Canvas尺寸与图片相同
             canvas.width = img.width;
             canvas.height = img.height;
             
             // 清除之前的绘制
             ctx.clearRect(0, 0, canvas.width, canvas.height);
             
             // 为不同类别设置不同颜色
             const colors = {
                 person: '#FF3B30',
                 car: '#5AC8FA',
                 building: '#4CD964',
                 object: '#FF9500'
             };
             
             // 绘制每个检测结果
             detections.forEach(detection => {
                 const { bbox, class: className, confidence } = detection;
                 const [x, y, width, height] = bbox;
                 
                 // 设置边框样式
                 ctx.strokeStyle = colors[className] || '#FFCC00';
                 ctx.lineWidth = 2;
                 
                 // 绘制边框
                 ctx.strokeRect(x, y, width, height);
                 
                 // 设置标签背景
                 ctx.fillStyle = colors[className] || '#FFCC00';
                 const label = `${className}: ${(confidence * 100).toFixed(1)}%`;
                 const textWidth = ctx.measureText(label).width;
                 
                 // 绘制标签背景
                 ctx.fillRect(x, y - 20, textWidth + 10, 20);
                 
                 // 设置标签文字
                 ctx.fillStyle = '#FFFFFF';
                 ctx.font = '14px Arial';
                 ctx.fillText(label, x + 5, y - 5);
             });
         }
     }
     
     // 显示检测结果列表
     function displayResultsList(detections) {
         // 清空表格
         resultsTableBody.innerHTML = '';
         
         // 为每个检测结果创建表格行
         detections.forEach(detection => {
             const { bbox, class: className, confidence } = detection;
             
             const row = document.createElement('tr');
             row.className = 'border-b border-gray-200';
             
             // 添加类别列
             const classCell = document.createElement('td');
             classCell.className = 'px-4 py-2 font-medium';
             classCell.textContent = className;
             row.appendChild(classCell);
             
             // 添加可信度列
             const confidenceCell = document.createElement('td');
             confidenceCell.className = 'px-4 py-2';
             confidenceCell.textContent = `${(confidence * 100).toFixed(1)}%`;
             row.appendChild(confidenceCell);
             
             // 添加位置列
             const positionCell = document.createElement('td');
             positionCell.className = 'px-4 py-2';
             positionCell.textContent = `X: ${bbox[0]}, Y: ${bbox[1]}, 宽: ${bbox[2]}, 高: ${bbox[3]}`;
             row.appendChild(positionCell);
             
             // 将行添加到表格
             resultsTableBody.appendChild(row);
         });
         
         // 显示结果容器
         resultsContainer.classList.remove('hidden');
     }
     
     // 显示错误信息
     function showError(message) {
         errorMessage.textContent = message;
         errorMessage.classList.remove('hidden');
     }
     
     // 隐藏错误信息
     function hideError() {
         errorMessage.classList.add('hidden');
     }
     
     // 清除检测结果
     function clearResults() {
         // 清除Canvas
         if (detectionCanvas) {
             const ctx = detectionCanvas.getContext('2d');
             ctx.clearRect(0, 0, detectionCanvas.width, detectionCanvas.height);
         }
         
         // 隐藏结果容器
         resultsContainer.classList.add('hidden');
         
         // 清空结果表格
         resultsTableBody.innerHTML = '';
         
         // 隐藏错误信息
         hideError();
     }