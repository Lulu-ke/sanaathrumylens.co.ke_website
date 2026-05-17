'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { UserPlus, Search, Download, Trash2, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

interface Subscriber {
  id: string;
  email: string;
  name: string | null;
  status: string;
  createdAt: string;
}

export default function SubscribersPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['subscribers', statusFilter],
    queryFn: async () => {
      const params = statusFilter !== 'all' ? `?status=${statusFilter}` : '';
      const res = await fetch(`/api/newsletter${params}`);
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json();
    },
  });

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this subscriber?')) return;
    try {
      const res = await fetch(`/api/newsletter/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Subscriber deleted');
        queryClient.invalidateQueries({ queryKey: ['subscribers'] });
      } else {
        toast.error('Failed to delete');
      }
    } catch {
      toast.error('Something went wrong');
    }
  };

  const handleExportCSV = () => {
    const subscribers = filteredSubscribers;
    if (subscribers.length === 0) {
      toast.error('No subscribers to export');
      return;
    }

    const headers = ['Email', 'Name', 'Status', 'Subscribed Date'];
    const rows = subscribers.map((s: Subscriber) => [
      s.email,
      s.name || '',
      s.status,
      new Date(s.createdAt).toLocaleDateString(),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row: string[]) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `subscribers_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);

    toast.success('CSV exported successfully');
  };

  const allSubscribers = data?.subscribers || [];
  const filteredSubscribers = allSubscribers.filter((s: Subscriber) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      s.email.toLowerCase().includes(q) ||
      (s.name && s.name.toLowerCase().includes(q))
    );
  });

  const activeCount = allSubscribers.filter((s: Subscriber) => s.status === 'ACTIVE').length;
  const unsubscribedCount = allSubscribers.filter((s: Subscriber) => s.status === 'UNSUBSCRIBED').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <UserPlus className="h-6 w-6 text-primary" />
            Newsletter Subscribers
          </h1>
          <p className="text-muted-foreground">Manage your newsletter subscriber list</p>
        </div>
        <Button variant="outline" className="gap-2" onClick={handleExportCSV}>
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{allSubscribers.length}</p>
            <p className="text-xs text-muted-foreground">Total Subscribers</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-emerald-600">{activeCount}</p>
            <p className="text-xs text-muted-foreground">Active</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-muted-foreground">{unsubscribedCount}</p>
            <p className="text-xs text-muted-foreground">Unsubscribed</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by email or name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="UNSUBSCRIBED">Unsubscribed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Subscriber List */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-14 bg-muted rounded animate-pulse" />
          ))}
        </div>
      ) : filteredSubscribers.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Mail className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground">
              {searchQuery ? 'No subscribers match your search' : 'No subscribers yet'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="border rounded-lg">
          <div className="grid grid-cols-[1fr_1fr_100px_120px_60px] gap-4 p-3 text-xs font-medium text-muted-foreground border-b bg-muted/30">
            <span>Email</span>
            <span>Name</span>
            <span>Status</span>
            <span>Subscribed</span>
            <span></span>
          </div>
          <div className="divide-y max-h-96 overflow-y-auto">
            {filteredSubscribers.map((subscriber: Subscriber) => (
              <div
                key={subscriber.id}
                className="grid grid-cols-[1fr_1fr_100px_120px_60px] gap-4 p-3 text-sm hover:bg-accent/30 transition-colors"
              >
                <span className="truncate">{subscriber.email}</span>
                <span className="truncate text-muted-foreground">
                  {subscriber.name || '—'}
                </span>
                <Badge
                  variant={subscriber.status === 'ACTIVE' ? 'default' : 'secondary'}
                  className="text-[10px] h-5 w-fit"
                >
                  {subscriber.status}
                </Badge>
                <span className="text-muted-foreground text-xs">
                  {new Date(subscriber.createdAt).toLocaleDateString()}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                  onClick={() => handleDelete(subscriber.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
