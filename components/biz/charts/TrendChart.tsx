import { useTheme } from '@/context/ThemeContext';
import React from 'react';
import { Text, View } from 'react-native';
import { LineChart } from 'react-native-chart-kit';

interface TrendChartProps {
  color: string;
  data: {
    xAxis: string[];
    yAxis: number[];
  };
  title?: string;
  height?: number;
}

export const TrendChart = ({ 
  color, 
  data, 
  title = "每日趋势",
  height = 200
}: TrendChartProps) => {
  const { isDarkMode } = useTheme();
  const { xAxis, yAxis } = data;
  
  // 图表宽度和高度配置
  const chartWidth = 340; // 固定宽度，确保图表显示完整
  const chartHeight = 200; // 固定高度
  
  // 优化X轴标签显示：确保最多显示12个标签
  const optimizedLabels = xAxis.map((label, index) => {
    // 计算间隔步长，确保最多显示12个标签
    const step = Math.max(1, Math.ceil(xAxis.length / 12));
    
    // 只显示能被步长整除的索引对应的标签
    return index % step === 0 ? label : '';
  });
  
  // 准备图表数据
  const chartData = {
    labels: optimizedLabels,
    datasets: [
      {
        data: yAxis,
        color: (opacity = 1) => color,
        strokeWidth: 3,
      }
    ],
  };
  
  // 图表配置
  const chartConfig = {
    backgroundColor: isDarkMode ? '#1B1B1C' : '#FFFFFF',
    backgroundGradientFrom: isDarkMode ? '#1B1B1C' : '#FFFFFF',
    backgroundGradientTo: isDarkMode ? '#1B1B1C' : '#FFFFFF',
    decimalPlaces: 0,
    color: (opacity = 1) => isDarkMode ? `rgba(255, 255, 255, ${opacity})` : `rgba(0, 0, 0, ${opacity})`,
    labelColor: (opacity = 1) => isDarkMode ? `rgba(255, 255, 255, ${opacity})` : `rgba(107, 114, 128, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '4',
      strokeWidth: '2',
      stroke: isDarkMode ? '#1B1B1C' : '#FFFFFF',
    },
    propsForBackgroundLines: {
      strokeWidth: 0.5,
      stroke: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(229, 231, 235, 0.5)',
    },
    fillShadowGradient: color,
    fillShadowGradientOpacity: 0.3,
  };

  return (
    <View className="w-full bg-card rounded-2xl p-4 mb-4 shadow-sm">
      <Text className="text-text font-bold text-sm mb-4 pl-1">{title}</Text>
      
      {/* 图表容器 */}
      <View className="w-full items-center justify-center" style={{ height: height }}>
        {yAxis.length > 0 ? (
          <View className="overflow-hidden rounded-lg">
            <LineChart
              data={chartData}
              width={chartWidth}
              height={chartHeight}
              chartConfig={chartConfig}
              bezier
              withDots={true}
              withShadow={true}
              withInnerLines={true}
              withOuterLines={true}
              withVerticalLines={true}
              withHorizontalLines={true}
              fromZero={false}
              style={{
                borderRadius: 8,
              }}
            />
          </View>
        ) : (
          <View className="flex-1 justify-center items-center">
            <Text className="text-gray-400 text-sm">暂无数据</Text>
          </View>
        )}
      </View>
    </View>
  );
};