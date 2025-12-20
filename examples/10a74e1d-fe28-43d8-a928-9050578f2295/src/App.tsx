import React, { useState, useCallback } from 'react';
import { Scale, Ruler, Info } from 'lucide-react';

function App() {
  const [height, setHeight] = useState<string>('');
  const [weight, setWeight] = useState<string>('');
  const [bmi, setBmi] = useState<number | null>(null);

  const calculateBMI = useCallback(() => {
    if (height && weight) {
      const heightInMeters = parseFloat(height) / 100;
      const weightInKg = parseFloat(weight);
      const bmiValue = weightInKg / (heightInMeters * heightInMeters);
      setBmi(parseFloat(bmiValue.toFixed(1)));
    }
  }, [height, weight]);

  const getBMICategory = (bmi: number): { category: string; color: string } => {
    if (bmi < 18.5) {
      return { category: '体重过轻', color: 'text-blue-600' };
    } else if (bmi < 24) {
      return { category: '体重正常', color: 'text-green-600' };
    } else if (bmi < 28) {
      return { category: '超重', color: 'text-yellow-600' };
    } else {
      return { category: '肥胖', color: 'text-red-600' };
    }
  };

  const getHealthAdvice = (bmi: number): string => {
    if (bmi < 18.5) {
      return '建议：适当增加营养摄入，注意均衡饮食，适量运动增强体质。';
    } else if (bmi < 24) {
      return '建议：继续保持健康的生活方式，定期运动，维持均衡饮食。';
    } else if (bmi < 28) {
      return '建议：控制饮食摄入，增加运动量，注意营养均衡，逐步将体重降至正常范围。';
    } else {
      return '建议：及时就医咨询，制定科学的减重计划，培养健康的生活习惯。';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">BMI 计算器</h1>
          <p className="text-gray-600">输入身高体重，计算您的身体质量指数</p>
        </div>

        <div className="space-y-6">
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              身高 (cm)
            </label>
            <div className="relative">
              <Ruler className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="number"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                className="pl-12 pr-4 py-3 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                placeholder="请输入身高"
              />
            </div>
          </div>

          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              体重 (kg)
            </label>
            <div className="relative">
              <Scale className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="number"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="pl-12 pr-4 py-3 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                placeholder="请输入体重"
              />
            </div>
          </div>

          <button
            onClick={calculateBMI}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition duration-200 ease-in-out transform hover:scale-[1.02]"
          >
            计算 BMI
          </button>

          {bmi !== null && (
            <div className="mt-6 p-6 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-4">
                <span className="text-lg font-medium text-gray-700">您的 BMI 指数</span>
                <span className="text-2xl font-bold text-blue-600">{bmi}</span>
              </div>
              
              <div className="mb-4">
                <span className="text-lg font-medium text-gray-700">体重状态：</span>
                <span className={`text-lg font-bold ${getBMICategory(bmi).color}`}>
                  {getBMICategory(bmi).category}
                </span>
              </div>

              <div className="flex items-start space-x-2 text-gray-600">
                <Info className="flex-shrink-0 mt-1" size={20} />
                <p>{getHealthAdvice(bmi)}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;