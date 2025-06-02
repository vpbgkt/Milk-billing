'use client';

import React, { useEffect, useState } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  MoreVertical, 
  Eye, 
  Edit, 
  Ban, 
  Trash2,
  UserCheck,
  UserX
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import { formatDate, debounce } from '@/lib/utils';
import { superAdminService } from '@/services/superadmin';
import { User } from '@/types';

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [suspensionReason, setSuspensionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const itemsPerPage = 10;

  useEffect(() => {
    fetchUsers();
  }, [currentPage, roleFilter]);

  // Debounced search
  useEffect(() => {
    const debouncedSearch = debounce(() => {
      setCurrentPage(1);
      fetchUsers();
    }, 500);

    debouncedSearch();
  }, [searchTerm]);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const data = await superAdminService.getAllUsers(
        currentPage,
        itemsPerPage,
        searchTerm,
        roleFilter
      );

      setUsers(data.users || []); // Ensure users is always an array
      setTotalUsers(data.total || 0);
      setTotalPages(data.pages || 1);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      setUsers([]); // Fallback to empty array on error
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuspendUser = async () => {
    if (!selectedUser || !suspensionReason.trim()) return;
    
    try {
      setActionLoading(true);
      await superAdminService.suspendUser(selectedUser._id, suspensionReason);
      
      // Update user in local state
      setUsers(users.map(user => 
        user._id === selectedUser._id 
          ? { ...user, isSuspended: true, suspensionReason }
          : user
      ));
      
      setShowSuspendModal(false);
      setSuspensionReason('');
      setSelectedUser(null);
    } catch (error) {
      console.error('Failed to suspend user:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnsuspendUser = async (user: User) => {
    try {
      setActionLoading(true);
      await superAdminService.unsuspendUser(user._id);
      
      // Update user in local state
      setUsers(users.map(u => 
        u._id === user._id 
          ? { ...u, isSuspended: false, suspensionReason: undefined }
          : u
      ));
    } catch (error) {
      console.error('Failed to unsuspend user:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = async (user: User) => {
    if (!confirm(`Are you sure you want to delete ${user.name}? This action cannot be undone.`)) {
      return;
    }

    try {
      setActionLoading(true);
      await superAdminService.deleteUser(user._id);
      
      // Remove user from local state
      setUsers(users.filter(u => u._id !== user._id));
      setTotalUsers(totalUsers - 1);
    } catch (error) {
      console.error('Failed to delete user:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'superadmin': return 'bg-purple-100 text-purple-800';
      case 'supplier': return 'bg-blue-100 text-blue-800';
      case 'user': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusBadge = (user: User) => {
    if (user.isSuspended) {
      return <span className="px-2 py-1 text-xs font-semibold bg-red-100 text-red-800 rounded-full">Suspended</span>;
    }
    if (user.isActive) {
      return <span className="px-2 py-1 text-xs font-semibold bg-green-100 text-green-800 rounded-full">Active</span>;
    }
    return <span className="px-2 py-1 text-xs font-semibold bg-yellow-100 text-yellow-800 rounded-full">Inactive</span>;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <Users className="w-5 h-5 mr-2" />
              User Management
            </CardTitle>
            <div className="text-sm text-gray-500">
              Total: {totalUsers} users
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <Input
                  type="text"
                  placeholder="Search users by name, email, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="sm:w-48">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 focus:outline-none"
              >
                <option value="">All Roles</option>
                <option value="user">Users</option>
                <option value="supplier">Suppliers</option>
                <option value="superadmin">Super Admins</option>
              </select>
            </div>
          </div>          {/* Users Display */}
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-500 mt-2">Loading users...</p>
            </div>
          ) : (Array.isArray(users) && users.length === 0) ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No users found</p>
            </div>
          ) : (
            <>
              {/* Mobile Card Layout */}
              <div className="block md:hidden space-y-4">
                {users.map((user) => (
                  <div key={user._id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 text-lg">{user.name}</h3>
                        <p className="text-sm text-gray-500 mt-1">{user.email}</p>
                        <p className="text-sm text-gray-500">{user.phone}</p>
                      </div>
                      <div className="flex items-center space-x-1 ml-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedUser(user);
                            setShowUserModal(true);
                          }}
                          className="p-2"
                        >
                          <Eye size={16} />
                        </Button>
                        
                        {user.isSuspended ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleUnsuspendUser(user)}
                            disabled={actionLoading}
                            className="p-2"
                          >
                            <UserCheck size={16} />
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedUser(user);
                              setShowSuspendModal(true);
                            }}
                            className="p-2"
                          >
                            <UserX size={16} />
                          </Button>
                        )}
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteUser(user)}
                          disabled={actionLoading}
                          className="text-red-600 hover:text-red-700 p-2"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(user.role)}`}>
                          {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                        </span>
                        {getStatusBadge(user)}
                      </div>
                      <div className="text-xs text-gray-500">
                        Joined {formatDate(user.createdAt)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table Layout */}
              <div className="hidden md:block">
                <div className="overflow-x-auto -mx-4 md:mx-0">
                  <div className="inline-block min-w-full align-middle">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            User
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Role
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Joined
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {users.map((user) => (
                          <tr key={user._id} className="hover:bg-gray-50 transition-colors duration-150">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className="text-sm font-medium text-gray-900">{user.name}</div>
                                <div className="text-sm text-gray-500">{user.email}</div>
                                <div className="text-sm text-gray-500">{user.phone}</div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(user.role)}`}>
                                {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {getStatusBadge(user)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatDate(user.createdAt)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex items-center justify-end space-x-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedUser(user);
                                    setShowUserModal(true);
                                  }}
                                  className="text-gray-600 hover:text-gray-900"
                                >
                                  <Eye size={16} />
                                </Button>
                                
                                {user.isSuspended ? (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleUnsuspendUser(user)}
                                    disabled={actionLoading}
                                    className="text-green-600 hover:text-green-700"
                                  >
                                    <UserCheck size={16} />
                                  </Button>
                                ) : (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedUser(user);
                                      setShowSuspendModal(true);
                                    }}
                                    className="text-orange-600 hover:text-orange-700"
                                  >
                                    <UserX size={16} />
                                  </Button>
                                )}
                                
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteUser(user)}
                                  disabled={actionLoading}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 size={16} />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </>
          )}          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between mt-6 gap-4">
              <div className="text-sm text-gray-500 order-2 sm:order-1">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalUsers)} of {totalUsers} users
              </div>
              <div className="flex items-center space-x-1 order-1 sm:order-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-2"
                >
                  <span className="hidden sm:inline">Previous</span>
                  <span className="sm:hidden">Prev</span>
                </Button>
                
                {/* Show fewer pages on mobile */}
                <div className="hidden sm:flex items-center space-x-1">
                  {[...Array(totalPages)].map((_, index) => {
                    const page = index + 1;
                    if (page === currentPage || page === 1 || page === totalPages || 
                        (page >= currentPage - 1 && page <= currentPage + 1)) {
                      return (
                        <Button
                          key={page}
                          variant={page === currentPage ? "primary" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(page)}
                          className="w-10"
                        >
                          {page}
                        </Button>
                      );
                    }
                    return null;
                  })}
                </div>
                
                {/* Mobile pagination - show only current page */}
                <div className="sm:hidden flex items-center space-x-2">
                  <span className="text-sm text-gray-600">
                    Page {currentPage} of {totalPages}
                  </span>
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2"
                >
                  <span className="hidden sm:inline">Next</span>
                  <span className="sm:hidden">Next</span>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Details Modal */}
      <Modal
        isOpen={showUserModal}
        onClose={() => {
          setShowUserModal(false);
          setSelectedUser(null);
        }}
        title="User Details"
        size="lg"
      >        {selectedUser && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <p className="mt-1 text-sm text-gray-900">{selectedUser.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <p className="mt-1 text-sm text-gray-900 break-words">{selectedUser.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone</label>
                <p className="mt-1 text-sm text-gray-900">{selectedUser.phone}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Role</label>
                <p className="mt-1 text-sm text-gray-900">{selectedUser.role}</p>
              </div>
              {selectedUser.address && (
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Address</label>
                  <p className="mt-1 text-sm text-gray-900 break-words">{selectedUser.address}</p>
                </div>
              )}
              {selectedUser.businessName && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Business Name</label>
                  <p className="mt-1 text-sm text-gray-900 break-words">{selectedUser.businessName}</p>
                </div>
              )}
              {selectedUser.businessType && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Business Type</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedUser.businessType}</p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <div className="mt-1">{getStatusBadge(selectedUser)}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Joined</label>
                <p className="mt-1 text-sm text-gray-900">{formatDate(selectedUser.createdAt)}</p>
              </div>
            </div>
            
            {selectedUser.isSuspended && selectedUser.suspensionReason && (
              <div className="mt-4 p-4 bg-red-50 rounded-md">
                <label className="block text-sm font-medium text-red-700">Suspension Reason</label>
                <p className="mt-1 text-sm text-red-900">{selectedUser.suspensionReason}</p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Suspend User Modal */}
      <Modal
        isOpen={showSuspendModal}
        onClose={() => {
          setShowSuspendModal(false);
          setSelectedUser(null);
          setSuspensionReason('');
        }}
        title="Suspend User"
      >
        {selectedUser && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              You are about to suspend <strong>{selectedUser.name}</strong>. 
              Please provide a reason for the suspension.
            </p>
            
            <textarea
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 focus:outline-none"
              rows={3}
              placeholder="Enter suspension reason..."
              value={suspensionReason}
              onChange={(e) => setSuspensionReason(e.target.value)}
            />
              <div className="flex flex-col-reverse sm:flex-row justify-end space-y-3 space-y-reverse sm:space-y-0 sm:space-x-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowSuspendModal(false);
                  setSelectedUser(null);
                  setSuspensionReason('');
                }}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleSuspendUser}
                loading={actionLoading}
                disabled={!suspensionReason.trim()}
                className="w-full sm:w-auto"
              >
                Suspend User
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default UserManagement;
