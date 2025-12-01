import React from 'react';
import { Text, View } from 'react-native';
import { PieChart } from 'react-native-chart-kit';

interface DonutData {
  color: string;
  percentage: number; // 0-100
  label: string;
}

interface CategoryDonutChartProps {
  data: DonutData[];
}

export const CategoryDonutChart = ({ data }: CategoryDonutChartProps) => {
  // 1. 将你的数据格式转换为 ChartKit 需要的格式
  const chartData = data.map((item) => ({
    name: item.label,
    population: item.percentage, // 饼图根据这个数值计算比例
    color: item.color,
    legendFontColor: "#7F7F7F", // 即使隐藏图例，这些属性也是必须的或建议保留
    legendFontSize: 15,
  }));

  // 图表尺寸配置
  const chartSize = 120; // 对应原本 w-[120px]

  return (
    <View className="w-full bg-card rounded-2xl p-4 mb-4 shadow-sm">
      <View className="flex-row justify-between items-center mb-4">
        <Text className="text-text font-bold text-sm pl-1">分类构成</Text>
      </View>

      <View className="flex-row items-center">
        {/* 左侧图表区域 */}
        <View className="items-center justify-center" style={{ width: chartSize, height: chartSize }}>
          
          {/* 使用 PieChart 替换原本的 SVG */}
          <PieChart
            data={chartData}
            width={chartSize}
            height={chartSize}
            chartConfig={{
              color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              decimalPlaces: 0,
            }}
            accessor={"population"} // 指定使用哪个字段作为数值
            backgroundColor={"transparent"}
            paddingLeft={"30"} // 重要：用于修正饼图在容器中的位置，使其居中
            center={[0, 0]}
            hasLegend={false} // 隐藏库自带的图例，使用你原本自定义的
            absolute={false}
          />

          {/* 
            核心技巧：
            在饼图中间覆盖一个与背景色相同的圆形 View，
            实现 "甜甜圈 (Donut)" 效果并展示中间文字 
          */}
          <View 
            className="absolute bg-card rounded-full items-center justify-center"
            style={{ 
              width: chartSize * 0.66, // 调整内圆大小，控制圆环粗细 (约等于原本的 strokeWidth)
              height: chartSize * 0.66 
            }}
          >
            <Text className="text-text font-bold text-lg">Top 5</Text>
            <Text className="text-gray-400 text-[10px]">类别</Text>
          </View>
        </View>

        {/* 右侧图例 (保留你原本的代码，因为它的样式布局比库自带的更好看) */}
        <View className="flex-1 pl-6">
          <View className="flex-row flex-wrap gap-y-3">
            {data.map((item, index) => (
              <View key={index} className="w-[48%] flex-row items-center mr-1">
                <View 
                  style={{ backgroundColor: item.color }} 
                  className="w-2 h-2 rounded-full mr-2" 
                />
                <Text className="text-gray-500 text-xs">
                  {item.label} {item.percentage}%
                </Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    </View>
  );
};