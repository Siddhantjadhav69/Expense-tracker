import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { BarChart3, PieChart, TrendingDown, TrendingUp, AlertTriangle, Calendar } from 'lucide-react-native';

export default function Analytics() {
  const insets = useSafeAreaInsets();
  const [selectedPeriod, setSelectedPeriod] = useState('30');

  // Fetch analytics data
  const { data: analytics, isLoading, error } = useQuery({
    queryKey: ['analytics', selectedPeriod],
    queryFn: async () => {
      const response = await fetch(`/api/analytics?period=${selectedPeriod}`);
      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }
      return response.json();
    },
  });

  const formatCurrency = (amount) => {
    return `$${parseFloat(amount || 0).toFixed(2)}`;
  };

  const periods = [
    { label: '7 Days', value: '7' },
    { label: '30 Days', value: '30' },
    { label: '90 Days', value: '90' },
  ];

  if (error) {
    return (
      <View style={{ flex: 1, backgroundColor: '#F9FAFB', paddingTop: insets.top }}>
        <StatusBar style="dark" />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <AlertTriangle size={48} color="#EF4444" />
          <Text style={{ fontSize: 18, fontWeight: '600', color: '#1F2937', marginTop: 16, textAlign: 'center' }}>
            Failed to load analytics
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#F9FAFB', paddingTop: insets.top }}>
      <StatusBar style="dark" />
      
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 20 }} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={{ padding: 20, paddingBottom: 10 }}>
          <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#1F2937' }}>
            Analytics
          </Text>
          <Text style={{ fontSize: 16, color: '#6B7280', marginTop: 4 }}>
            Your spending insights and trends
          </Text>
        </View>

        {/* Period Selector */}
        <View style={{ marginHorizontal: 20, marginBottom: 20 }}>
          <View style={{
            flexDirection: 'row',
            backgroundColor: '#E5E7EB',
            borderRadius: 12,
            padding: 4
          }}>
            {periods.map((period) => (
              <TouchableOpacity
                key={period.value}
                onPress={() => setSelectedPeriod(period.value)}
                style={{
                  flex: 1,
                  paddingVertical: 8,
                  borderRadius: 8,
                  backgroundColor: selectedPeriod === period.value ? 'white' : 'transparent',
                  alignItems: 'center'
                }}
              >
                <Text style={{
                  fontWeight: '600',
                  fontSize: 14,
                  color: selectedPeriod === period.value ? '#3B82F6' : '#6B7280'
                }}>
                  {period.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {isLoading ? (
          <View style={{ padding: 20, alignItems: 'center' }}>
            <Text style={{ color: '#6B7280' }}>Loading analytics...</Text>
          </View>
        ) : (
          <>
            {/* Summary Cards */}
            <View style={{ marginHorizontal: 20, marginBottom: 20 }}>
              <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
                <View style={{
                  flex: 1,
                  backgroundColor: 'white',
                  borderRadius: 12,
                  padding: 16,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.05,
                  shadowRadius: 4,
                  elevation: 2
                }}>
                  <TrendingDown size={20} color="#EF4444" />
                  <Text style={{ fontSize: 14, color: '#6B7280', marginTop: 8 }}>Total Spent</Text>
                  <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#1F2937' }}>
                    {formatCurrency(analytics?.totalSpending)}
                  </Text>
                </View>
                
                <View style={{
                  flex: 1,
                  backgroundColor: 'white',
                  borderRadius: 12,
                  padding: 16,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.05,
                  shadowRadius: 4,
                  elevation: 2
                }}>
                  <TrendingUp size={20} color="#10B981" />
                  <Text style={{ fontSize: 14, color: '#6B7280', marginTop: 8 }}>Total Income</Text>
                  <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#1F2937' }}>
                    {formatCurrency(analytics?.totalIncome)}
                  </Text>
                </View>
              </View>

              <View style={{
                backgroundColor: 'white',
                borderRadius: 12,
                padding: 16,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 4,
                elevation: 2
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                  <BarChart3 size={20} color="#3B82F6" />
                  <Text style={{ fontSize: 16, fontWeight: '600', color: '#1F2937', marginLeft: 8 }}>
                    Net Flow
                  </Text>
                </View>
                <Text style={{ fontSize: 24, fontWeight: 'bold', color: analytics?.totalIncome - analytics?.totalSpending >= 0 ? '#10B981' : '#EF4444' }}>
                  {formatCurrency((analytics?.totalIncome || 0) - (analytics?.totalSpending || 0))}
                </Text>
                <Text style={{ fontSize: 14, color: '#6B7280', marginTop: 4 }}>
                  Last {selectedPeriod} days
                </Text>
              </View>
            </View>

            {/* Budget Status */}
            {analytics?.monthlyBudget && (
              <View style={{ marginHorizontal: 20, marginBottom: 20 }}>
                <View style={{
                  backgroundColor: 'white',
                  borderRadius: 12,
                  padding: 16,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.05,
                  shadowRadius: 4,
                  elevation: 2
                }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                    <Calendar size={20} color="#3B82F6" />
                    <Text style={{ fontSize: 16, fontWeight: '600', color: '#1F2937', marginLeft: 8 }}>
                      Monthly Budget
                    </Text>
                  </View>
                  
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                    <Text style={{ fontSize: 14, color: '#6B7280' }}>
                      Spent: {formatCurrency(analytics?.totalSpending)}
                    </Text>
                    <Text style={{ fontSize: 14, color: '#6B7280' }}>
                      Budget: {formatCurrency(analytics?.monthlyBudget)}
                    </Text>
                  </View>
                  
                  <View style={{
                    height: 8,
                    backgroundColor: '#F3F4F6',
                    borderRadius: 4,
                    overflow: 'hidden'
                  }}>
                    <View style={{
                      height: '100%',
                      width: `${Math.min((analytics?.totalSpending / analytics?.monthlyBudget) * 100, 100)}%`,
                      backgroundColor: analytics?.isOverBudget ? '#EF4444' : '#3B82F6'
                    }} />
                  </View>
                  
                  {analytics?.isOverBudget && (
                    <View style={{
                      backgroundColor: '#FEF2F2',
                      borderRadius: 8,
                      padding: 12,
                      marginTop: 12,
                      flexDirection: 'row',
                      alignItems: 'center'
                    }}>
                      <AlertTriangle size={16} color="#EF4444" />
                      <Text style={{ color: '#DC2626', fontWeight: '600', marginLeft: 8, flex: 1 }}>
                        You're over budget this month!
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            )}

            {/* Category Breakdown */}
            <View style={{ marginHorizontal: 20 }}>
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#1F2937', marginBottom: 16 }}>
                Spending by Category
              </Text>
              
              <View style={{
                backgroundColor: 'white',
                borderRadius: 12,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 4,
                elevation: 2
              }}>
                {analytics?.categorySpending?.length > 0 ? (
                  analytics.categorySpending.map((category, index) => {
                    const percentage = analytics.totalSpending > 0 ? (category.total_spent / analytics.totalSpending) * 100 : 0;
                    
                    return (
                      <View key={category.category}>
                        <View style={{ padding: 16 }}>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                            <Text style={{ fontSize: 16, fontWeight: '600', color: '#1F2937' }}>
                              {category.category}
                            </Text>
                            <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#1F2937' }}>
                              {formatCurrency(category.total_spent)}
                            </Text>
                          </View>
                          
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                            <Text style={{ fontSize: 14, color: '#6B7280' }}>
                              {category.transaction_count} transaction{category.transaction_count !== 1 ? 's' : ''}
                            </Text>
                            <Text style={{ fontSize: 14, color: '#6B7280' }}>
                              {percentage.toFixed(1)}%
                            </Text>
                          </View>
                          
                          <View style={{
                            height: 6,
                            backgroundColor: '#F3F4F6',
                            borderRadius: 3,
                            overflow: 'hidden'
                          }}>
                            <View style={{
                              height: '100%',
                              width: `${percentage}%`,
                              backgroundColor: '#3B82F6'
                            }} />
                          </View>
                        </View>
                        
                        {index < analytics.categorySpending.length - 1 && (
                          <View style={{ height: 1, backgroundColor: '#F3F4F6', marginHorizontal: 16 }} />
                        )}
                      </View>
                    );
                  })
                ) : (
                  <View style={{ padding: 20, alignItems: 'center' }}>
                    <PieChart size={48} color="#D1D5DB" />
                    <Text style={{ color: '#6B7280', marginTop: 12, textAlign: 'center' }}>
                      No spending data for this period
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}