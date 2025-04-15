'use client';

import { useState, useEffect } from 'react';
import { getCurrentUser } from '@/lib/auth';
import { getUserVotes, saveVote, getAllVotes } from '@/lib/votes';
import { User, Vote } from '@/lib/supabase';
import toast from 'react-hot-toast';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { FiCheckCircle, FiXCircle, FiCalendar, FiInfo } from 'react-icons/fi';

export default function VotesPage() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([
    new Date(),
    new Date(new Date().setDate(new Date().getDate() + 14))
  ]);
  const [votes, setVotes] = useState<Vote[]>([]);
  const [allVotes, setAllVotes] = useState<any[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        const { user } = await getCurrentUser();
        
        if (!user) {
          toast.error('로그인이 필요합니다.');
          return;
        }
        
        setUser(user);
        setIsAdmin(user.role === 'admin');
        
        if (user.role === 'admin') {
          // 관리자: 모든 투표 로드
          loadAllVotes();
        } else {
          // 기사: 자신의 투표만 로드
          loadUserVotes(user.id);
        }
      } catch (error) {
        console.error('Error loading votes:', error);
        toast.error('투표 정보를 불러오는데 실패했습니다.');
      } finally {
        setIsLoading(false);
      }
    }
    
    loadData();
  }, []);
  
  const loadUserVotes = async (userId: string) => {
    try {
      const today = new Date();
      const startDate = today.toISOString().split('T')[0];
      const endDate = new Date(today.setDate(today.getDate() + 30)).toISOString().split('T')[0];
      
      const votesData = await getUserVotes(userId, startDate, endDate);
      setVotes(votesData);
    } catch (error) {
      console.error('Error loading user votes:', error);
      toast.error('투표 정보를 불러오는데 실패했습니다.');
    }
  };
  
  const loadAllVotes = async () => {
    try {
      if (!dateRange[0] || !dateRange[1]) return;
      
      const startDate = dateRange[0].toISOString().split('T')[0];
      const endDate = dateRange[1].toISOString().split('T')[0];
      
      const votesData = await getAllVotes(startDate, endDate);
      setAllVotes(votesData);
    } catch (error) {
      console.error('Error loading all votes:', error);
      toast.error('투표 정보를 불러오는데 실패했습니다.');
    }
  };

  const handleVote = async (isAvailable: boolean) => {
    if (!user || !selectedDate) return;
    
    try {
      const dateString = selectedDate.toISOString().split('T')[0];
      
      await saveVote({
        courier_id: user.id,
        date: dateString,
        is_available: isAvailable
      });
      
      toast.success(`${dateString} 날짜에 ${isAvailable ? '근무 가능' : '근무 불가능'}으로 투표했습니다.`);
      
      // 투표 목록 갱신
      loadUserVotes(user.id);
    } catch (error) {
      console.error('Error saving vote:', error);
      toast.error('투표에 실패했습니다.');
    }
  };
  
  const handleDateRangeChange = (update: [Date | null, Date | null]) => {
    setDateRange(update);
    if (update[0] && update[1]) {
      loadAllVotes();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="py-6">
      <h2 className="text-2xl font-semibold text-secondary-800 mb-6">근무 가능 여부 투표</h2>
      
      {isAdmin ? (
        // 관리자 화면
        <div>
          <div className="card mb-6">
            <div className="card-header flex justify-between items-center">
              <h3 className="text-lg font-semibold">투표 현황 조회</h3>
            </div>
            <div className="card-body">
              <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4 items-start md:items-center">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">기간 선택</label>
                  <DatePicker
                    selectsRange={true}
                    startDate={dateRange[0]}
                    endDate={dateRange[1]}
                    onChange={handleDateRangeChange}
                    className="form-input w-full rounded-md border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    dateFormat="yyyy-MM-dd"
                  />
                </div>
                <button 
                  onClick={loadAllVotes} 
                  className="btn-primary mt-6 md:mt-0"
                >
                  조회하기
                </button>
              </div>
            </div>
          </div>
          
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold">투표 결과</h3>
            </div>
            <div className="card-body">
              {allVotes.length === 0 ? (
                <div className="text-center py-8">
                  <FiInfo className="h-12 w-12 mx-auto text-secondary-400 mb-4" />
                  <p className="text-secondary-600">조회된 투표 내역이 없습니다.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-secondary-200">
                    <thead className="bg-secondary-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                          기사명
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                          날짜
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                          근무 가능 여부
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                          투표 일시
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-secondary-200">
                      {allVotes.map((vote: any) => (
                        <tr key={vote.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-900">
                            {vote.users?.name || '알 수 없음'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-900">
                            {vote.date}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {vote.is_available ? (
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                가능
                              </span>
                            ) : (
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                                불가능
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">
                            {new Date(vote.created_at).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        // 기사 화면
        <div>
          <div className="card mb-6">
            <div className="card-header">
              <h3 className="text-lg font-semibold">근무 가능 여부 투표하기</h3>
            </div>
            <div className="card-body">
              <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4 items-start md:items-center">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">날짜 선택</label>
                  <DatePicker
                    selected={selectedDate}
                    onChange={(date) => setSelectedDate(date)}
                    minDate={new Date()}
                    className="form-input w-full rounded-md border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    dateFormat="yyyy-MM-dd"
                  />
                </div>
                <div className="flex space-x-2">
                  <button 
                    onClick={() => handleVote(true)}
                    className="flex items-center bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-md transition duration-200"
                  >
                    <FiCheckCircle className="h-5 w-5 mr-2" />
                    근무 가능
                  </button>
                  <button 
                    onClick={() => handleVote(false)}
                    className="flex items-center bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-md transition duration-200"
                  >
                    <FiXCircle className="h-5 w-5 mr-2" />
                    근무 불가능
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          <div className="card">
            <div className="card-header flex justify-between items-center">
              <h3 className="text-lg font-semibold">내 투표 현황</h3>
            </div>
            <div className="card-body">
              {votes.length === 0 ? (
                <div className="text-center py-8">
                  <FiCalendar className="h-12 w-12 mx-auto text-secondary-400 mb-4" />
                  <p className="text-secondary-600 mb-4">투표 내역이 없습니다.</p>
                  <p className="text-secondary-500">위에서 날짜를 선택하고 근무 가능 여부를 투표해주세요.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {votes.map((vote) => (
                    <div key={vote.id} className={`p-4 rounded-lg border ${vote.is_available ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{vote.date}</span>
                        {vote.is_available ? (
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                            근무 가능
                          </span>
                        ) : (
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                            근무 불가능
                          </span>
                        )}
                      </div>
                      <div className="mt-2 text-xs text-secondary-500">
                        투표 일시: {new Date(vote.created_at).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}