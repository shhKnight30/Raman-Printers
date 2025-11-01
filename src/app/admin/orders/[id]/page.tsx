/**
 * @file src/app/admin/orders/[id]/page.tsx
 * @description Admin order details page with file viewing and printing capabilities
 */
"use client";
import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Download, Printer, Eye, FileText, Image as ImageIcon, File } from "lucide-react";
import { showError, showSuccess } from "@/lib/toast";
import { handleApiError, handleNetworkError } from "@/lib/apiErrorHandler";

interface FileDescriptor {
  name: string;
  path: string;
  size: number;
  type: string;
  pages: number;
}

interface OrderDetails {
  id: string;
  name: string;
  phone: string;
  pages: number;
  tokenId: string;
  copies: number;
  notes?: string;
  totalAmount: number;
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
  paymentStatus: 'PENDING' | 'PAID' | 'VERIFIED';
  files: FileDescriptor[];
  createdAt: Date;
  user: {
    phone: string;
    tokenId: string;
    isVerified: boolean;
  };
}

export default function OrderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;
  
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);

  const loadOrderDetails = useCallback(async () => {
    try {
        const response = await fetch(`/api/admin/orders/${orderId}`);
      if (response.ok) {
        const data = await response.json();
        setOrder(data.data.order);
      } else {
        const errorData = await handleApiError(response, 'Failed to load order details');
        if (errorData) {
          showError(errorData.error, errorData.suggestion);
        }
      }
    } catch (error) {
      // Network errors or unexpected errors
      const networkError = handleNetworkError(error, 'Error loading order details');
      showError(networkError.error, networkError.suggestion);
    } finally {
      setIsLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    if (orderId) {
      loadOrderDetails();
    }
  }, [orderId, loadOrderDetails]);

  const getFileIcon = (file: FileDescriptor) => {
    const extension = file.name.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return <FileText className="h-5 w-5 text-red-500" />;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return <ImageIcon className="h-5 w-5 text-green-500" aria-label="Image file" />;
      case 'docx':
      case 'doc':
        return <FileText className="h-5 w-5 text-blue-500" />;
      default:
        return <File className="h-5 w-5 text-gray-500" />;
    }
  };

  const getFileType = (file: FileDescriptor) => {
    const extension = file.name.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return 'PDF Document';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return 'Image';
      case 'docx':
      case 'doc':
        return 'Word Document';
      default:
        return 'File';
    }
  };

  const handleFileSelect = (file: FileDescriptor) => {
    setSelectedFiles(prev => 
      prev.includes(file.name) 
        ? prev.filter(f => f !== file.name)
        : [...prev, file.name]
    );
  };

  const handleSelectAll = () => {
    if (order) {
      setSelectedFiles(selectedFiles.length === order.files.length ? [] : order.files.map(f => f.name));
    }
  };

  const handlePrintFiles = () => {
    if (selectedFiles.length === 0) {
      showError('Please select files to print');
      return;
    }

    // Open each selected file in a new window for printing
    selectedFiles.forEach(fileName => {
      const fileUrl = `/uploads/${order?.phone}/${fileName}`;
      const printWindow = window.open(fileUrl, '_blank');
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
        };
      }
    });

    showSuccess(`Printing ${selectedFiles.length} file(s)`);
  };

  const handleDownloadFiles = () => {
    if (selectedFiles.length === 0) {
      showError('Please select files to download');
      return;
    }

    // Download each selected file
    selectedFiles.forEach(fileName => {
      const fileUrl = `/uploads/${order?.phone}/${fileName}`;
      const link = document.createElement('a');
      link.href = fileUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });

    showSuccess(`Downloaded ${selectedFiles.length} file(s)`);
  };

  const handleViewFile = (fileName: string) => {
    const fileUrl = `/uploads/${order?.phone}/${fileName}`;
    window.open(fileUrl, '_blank');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Order Not Found</h2>
          <p className="text-gray-600 mb-6">The order you&apos;re looking for doesn&apos;t exist.</p>
          <Button onClick={() => router.push('/admin/dashboard')} className="bg-gray-800 hover:bg-gray-900">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => router.push('/admin/dashboard')}
                className="text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Order Details</h1>
                <p className="text-gray-600">Order ID: {order.id}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Badge className={order.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : 
                                order.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : 
                                'bg-red-100 text-red-800'}>
                {order.status}
              </Badge>
              <Badge className={order.paymentStatus === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : 
                                order.paymentStatus === 'PAID' ? 'bg-blue-100 text-blue-800' : 
                                'bg-green-100 text-green-800'}>
                {order.paymentStatus}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order Information */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Order Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Customer Name</label>
                  <p className="text-lg font-semibold text-gray-900">{order.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Phone Number</label>
                  <p className="text-lg font-semibold text-gray-900">{order.phone}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Token ID</label>
                  <p className="text-lg font-semibold text-gray-900 font-mono">{order.tokenId}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Pages</label>
                  <p className="text-lg font-semibold text-gray-900">{order.pages}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Copies</label>
                  <p className="text-lg font-semibold text-gray-900">{order.copies}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Total Amount</label>
                  <p className="text-lg font-semibold text-gray-900">₹{order.totalAmount}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Order Date</label>
                  <p className="text-lg font-semibold text-gray-900">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </p>
                </div>
                {order.notes && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Special Instructions</label>
                    <div className="mt-2 p-3 bg-gray-50 rounded-lg border">
                      <p className="text-gray-900 whitespace-pre-wrap">{order.notes}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Files Section */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Files ({order.files.length})</CardTitle>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSelectAll}
                      className="text-sm"
                    >
                      {selectedFiles.length === order.files.length ? 'Deselect All' : 'Select All'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDownloadFiles}
                      disabled={selectedFiles.length === 0}
                      className="text-sm"
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Download ({selectedFiles.length})
                    </Button>
                    <Button
                      size="sm"
                      onClick={handlePrintFiles}
                      disabled={selectedFiles.length === 0}
                      className="bg-blue-600 hover:bg-blue-700 text-sm"
                    >
                      <Printer className="h-4 w-4 mr-1" />
                      Print ({selectedFiles.length})
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {order.files.length > 0 ? (
                  <div className="space-y-3">
                {order.files.map((file, index) => (
                  <div
                    key={index}
                    className={`flex items-center justify-between p-4 rounded-lg border-2 transition-colors cursor-pointer ${
                      selectedFiles.includes(file.name)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleFileSelect(file)}
                  >
                    <div className="flex items-center space-x-3">
                      {getFileIcon(file)}
                      <div>
                        <p className="font-medium text-gray-900">{file.name}</p>
                        <p className="text-sm text-gray-500">{getFileType(file)}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewFile(file.name);
                        }}
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <File className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No files uploaded for this order</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
