import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { DollarSign, TrendingDown, TrendingUp, AlertTriangle, RefreshCw } from 'lucide-react-native';

export default function Dashboard() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  // Fetch analytics data
  const { data: analytics, isLoading: analyticsLoading, error: analyticsError } = useQuery({
    queryKey: ['analytics'],
    queryFn: async () => {
      const response = await fetch('/api/analytics');
      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }
      return response.json();
    },
  });

  // Fetch recent transactions
  const { data: transactionsData, isLoading: transactionsLoading, error: transactionsError } = useQuery({
    queryKey: ['transactions'],
    queryFn: async () => {
      const response = await fetch('/api/transactions?limit=5');
      if (!response.ok) {
        throw new Error('Failed to fetch transactions');
      }
      return response.json();
    },
  });

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['analytics'] });
    queryClient.invalidateQueries({ queryKey: ['transactions'] });
  };

  const formatCurrency = (amount) => {
    return `$${parseFloat(amount || 0).toFixed(2)}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getTransactionIcon = (type) => {
    return type === 'credit' ? TrendingUp : TrendingDown;
  };

  const getTransactionColor = (type) => {
    return type === 'credit' ? '#10B981' : '#EF4444';
  };

  if (analyticsError || transactionsError) {
    return (
      <View style={{ flex: 1, backgroundColor: '#F9FAFB', paddingTop: insets.top }}>
        <StatusBar style="dark" />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <AlertTriangle size={48} color="#EF4444" />
          <Text style={{ fontSize: 18, fontWeight: '600', color: '#1F2937', marginTop: 16, textAlign: 'center' }}>
            Failed to load data
          </Text>
          <TouchableOpacity
            onPress={handleRefresh}
            style={{
              backgroundColor: '#3B82F6',
              paddingHorizontal: 20,
              paddingVertical: 12,
              borderRadius: 8,
              marginTop: 16,
              flexDirection: 'row',
              alignItems: 'center'
            }}
          >
            <RefreshCw size={16} color="white" />
            <Text style={{ color: 'white', fontWeight: '600', marginLeft: 8 }}>Try Again</Text>
          </TouchableOpacity>
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
            Expense Tracker
          </Text>
          <Text style={{ fontSize: 16, color: '#6B7280', marginTop: 4 }}>
            Track your spending and stay on budget
          </Text>
        </View>

        {/* Balance Card */}
        <View style={{ marginHorizontal: 20, marginBottom: 20 }}>
          <View style={{
            backgroundColor: 'white',
            borderRadius: 16,
            padding: 20,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 4
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <DollarSign size={24} color="#3B82F6" />
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#6B7280', marginLeft: 8 }}>
                Current Balance
              </Text>
            </View>
            <Text style={{ fontSize: 32, fontWeight: 'bold', color: '#1F2937' }}>
              {formatCurrency(analytics?.currentBalance)}
            </Text>
            
            {analytics?.isLowBalance && (
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
                  Low balance! Consider reducing spending.
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Quick Stats */}
        <View style={{ marginHorizontal: 20, marginBottom: 20 }}>
          <View style={{ flexDirection: 'row', gap: 12 }}>
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
              <Text style={{ fontSize: 14, color: '#6B7280', marginTop: 8 }}>Spent</Text>
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
              <Text style={{ fontSize: 14, color: '#6B7280', marginTop: 8 }}>Income</Text>
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#1F2937' }}>
                {formatCurrency(analytics?.totalIncome)}
              </Text>
            </View>
          </View>
        </View>

        {/* Recent Transactions */}
        <View style={{ marginHorizontal: 20 }}>
          <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#1F2937', marginBottom: 16 }}>
            Recent Transactions
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
            {transactionsLoading ? (
              <View style={{ padding: 20, alignItems: 'center' }}>
                <Text style={{ color: '#6B7280' }}>Loading transactions...</Text>
              </View>
            ) : transactionsData?.transactions?.length > 0 ? (
              transactionsData.transactions.map((transaction, index) => {
                const Icon = getTransactionIcon(transaction.transaction_type);
                const color = getTransactionColor(transaction.transaction_type);
                
                return (
                  <View key={transaction.id}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16 }}>
                      <View style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        backgroundColor: `${color}20`,
                        justifyContent: 'center',
                        alignItems: 'center'
                      }}>
                        <Icon size={20} color={color} />
                      </View>
                      
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={{ fontSize: 16, fontWeight: '600', color: '#1F2937' }}>
                          {transaction.merchant || transaction.description || 'Transaction'}
                        </Text>
                        <Text style={{ fontSize: 14, color: '#6B7280', marginTop: 2 }}>
                          {transaction.category} • {formatDate(transaction.transaction_date)}
                        </Text>
                      </View>
                      
                      <Text style={{
                        fontSize: 16,
                        fontWeight: 'bold',
                        color: color
                      }}>
                        {transaction.transaction_type === 'credit' ? '+' : '-'}{formatCurrency(transaction.amount)}
                      </Text>
                    </View>
                    
                    {index < transactionsData.transactions.length - 1 && (
                      <View style={{ height: 1, backgroundColor: '#F3F4F6', marginHorizontal: 16 }} />
                    )}
                  </View>
                );
              })
            ) : (
              <View style={{ padding: 20, alignItems: 'center' }}>
                <Text style={{ color: '#6B7280' }}>No transactions yet</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}