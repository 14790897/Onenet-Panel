import { calculateValueColor, getColorDescription } from '@/lib/value-color-utils';

// 测试智能颜色计算
console.log('=== 智能颜色测试 ===');

// 测试温度数据 (假设范围 18-35度)
const tempMin = 18, tempMax = 35;
console.log('\n温度数据测试 (范围: 18-35°C):');
[20, 25, 30, 33].forEach(temp => {
  const color = calculateValueColor(temp, tempMin, tempMax, false);
  console.log(`${temp}°C: ${color} (${getColorDescription(color)})`);
});

// 测试湿度数据 (假设范围 30-85%)
const humMin = 30, humMax = 85;
console.log('\n湿度数据测试 (范围: 30-85%):');
[35, 50, 65, 80].forEach(hum => {
  const color = calculateValueColor(hum, humMin, humMax, false);
  console.log(`${hum}%: ${color} (${getColorDescription(color)})`);
});

// 测试电池电压 (假设范围 3.2-4.2V, 反转逻辑)
const voltMin = 3.2, voltMax = 4.2;
console.log('\n电池电压测试 (范围: 3.2-4.2V, 高值为好):');
[3.3, 3.7, 4.0, 4.1].forEach(volt => {
  const color = calculateValueColor(volt, voltMin, voltMax, true);
  console.log(`${volt}V: ${color} (${getColorDescription(color)})`);
});

export { calculateValueColor, getColorDescription };
