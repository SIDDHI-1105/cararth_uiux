import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Share2, 
  Edit, 
  Trash2,
  BarChart3,
  Calendar,
  User,
  ExternalLink
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface BlogArticle {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  category: string;
  tags: string[];
  author: string;
  publishedAt: string;
  readTime: number;
  sources: string[];
  status: 'draft' | 'pending_approval' | 'approved' | 'published' | 'shared';
  approvedBy?: string;
  approvedAt?: string;
  socialMediaShared?: boolean;
  shareLinks?: {
    linkedin?: string;
    twitter?: string;
    facebook?: string;
    whatsapp?: string;
  };
}

export default function AdminBlogPage() {
  const [selectedArticle, setSelectedArticle] = useState<BlogArticle | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const queryClient = useQueryClient();

  // Fetch all articles
  const { data: articles = [], isLoading } = useQuery({
    queryKey: ['/api/admin/blog/articles'],
  });

  // Fetch analytics
  const { data: analytics } = useQuery({
    queryKey: ['/api/admin/blog/analytics'],
  });

  // Approve article mutation
  const approveArticle = useMutation({
    mutationFn: async ({ articleId, approver }: { articleId: string; approver: string }) => {
      return fetch(`/api/admin/blog/approve/${articleId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approver }),
      }).then(res => res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/blog/articles'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/blog/analytics'] });
    },
  });

  // Publish article mutation
  const publishArticle = useMutation({
    mutationFn: async (articleId: string) => {
      return fetch(`/api/admin/blog/publish/${articleId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }).then(res => res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/blog/articles'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/blog/analytics'] });
    },
  });

  // Share to social media mutation
  const shareToSocialMedia = useMutation({
    mutationFn: async (articleId: string) => {
      return fetch(`/api/admin/blog/share/${articleId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }).then(res => res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/blog/articles'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/blog/analytics'] });
    },
  });

  // Update article mutation
  const updateArticle = useMutation({
    mutationFn: async ({ articleId, updates }: { articleId: string; updates: Partial<BlogArticle> }) => {
      return fetch(`/api/admin/blog/update/${articleId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      }).then(res => res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/blog/articles'] });
      setEditMode(false);
    },
  });

  // Delete article mutation
  const deleteArticle = useMutation({
    mutationFn: async (articleId: string) => {
      return fetch(`/api/admin/blog/delete/${articleId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      }).then(res => res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/blog/articles'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/blog/analytics'] });
      setSelectedArticle(null);
    },
  });

  const filteredArticles = (articles as BlogArticle[]).filter((article: BlogArticle) => {
    if (filterStatus === 'all') return true;
    return article.status === filterStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'pending_approval': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-blue-100 text-blue-800';
      case 'published': return 'bg-green-100 text-green-800';
      case 'shared': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending_approval': return <Clock className="w-4 h-4" />;
      case 'approved': return <CheckCircle className="w-4 h-4" />;
      case 'published': return <CheckCircle className="w-4 h-4" />;
      case 'shared': return <Share2 className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const handleApprove = (articleId: string) => {
    const approver = 'Admin User'; // In real app, get from auth context
    approveArticle.mutate({ articleId, approver });
  };

  const handlePublish = (articleId: string) => {
    publishArticle.mutate(articleId);
  };

  const handleShare = (articleId: string) => {
    shareToSocialMedia.mutate(articleId);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold" data-testid="text-admin-title">Blog Content Management</h1>
            <p className="text-muted-foreground">Manage AI-generated content and social media distribution</p>
          </div>
          
          {analytics && (
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-card p-4 rounded-lg border text-center">
                <div className="text-2xl font-bold">{(analytics as any).total}</div>
                <div className="text-sm text-muted-foreground">Total Articles</div>
              </div>
              <div className="bg-card p-4 rounded-lg border text-center">
                <div className="text-2xl font-bold">{(analytics as any).pending}</div>
                <div className="text-sm text-muted-foreground">Pending Approval</div>
              </div>
              <div className="bg-card p-4 rounded-lg border text-center">
                <div className="text-2xl font-bold">{(analytics as any).published}</div>
                <div className="text-sm text-muted-foreground">Published</div>
              </div>
              <div className="bg-card p-4 rounded-lg border text-center">
                <div className="text-2xl font-bold">{(analytics as any).shared}</div>
                <div className="text-sm text-muted-foreground">Shared</div>
              </div>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6">
          {['all', 'pending_approval', 'approved', 'published', 'shared'].map((status) => (
            <Button
              key={status}
              variant={filterStatus === status ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterStatus(status)}
              data-testid={`filter-${status}`}
            >
              {status.replace('_', ' ').toUpperCase()}
            </Button>
          ))}
        </div>

        {/* Articles List */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {isLoading ? (
            [...Array(6)].map((_, i) => (
              <div key={i} className="bg-card p-6 rounded-lg border animate-pulse">
                <div className="h-4 bg-muted rounded mb-4"></div>
                <div className="h-20 bg-muted rounded mb-4"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
              </div>
            ))
          ) : (
            filteredArticles.map((article: BlogArticle) => (
              <div key={article.id} className="bg-card p-6 rounded-lg border">
                <div className="flex justify-between items-start mb-4">
                  <Badge className={getStatusColor(article.status)} data-testid={`status-${article.id}`}>
                    {getStatusIcon(article.status)}
                    <span className="ml-1">{article.status.replace('_', ' ')}</span>
                  </Badge>
                  
                  <div className="flex gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="sm" onClick={() => setSelectedArticle(article)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Article Details</DialogTitle>
                        </DialogHeader>
                        
                        {selectedArticle && (
                          <div className="space-y-4">
                            <div>
                              <label className="font-semibold">Title:</label>
                              <Input 
                                value={selectedArticle.title} 
                                disabled={!editMode}
                                onChange={(e) => setSelectedArticle({...selectedArticle, title: e.target.value})}
                              />
                            </div>
                            
                            <div>
                              <label className="font-semibold">Excerpt:</label>
                              <Textarea 
                                value={selectedArticle.excerpt} 
                                disabled={!editMode}
                                onChange={(e) => setSelectedArticle({...selectedArticle, excerpt: e.target.value})}
                              />
                            </div>
                            
                            <div>
                              <label className="font-semibold">Content:</label>
                              <Textarea 
                                value={selectedArticle.content} 
                                disabled={!editMode}
                                rows={10}
                                onChange={(e) => setSelectedArticle({...selectedArticle, content: e.target.value})}
                              />
                            </div>
                            
                            <div className="flex gap-2">
                              {!editMode ? (
                                <Button onClick={() => setEditMode(true)}>
                                  <Edit className="w-4 h-4 mr-2" />
                                  Edit
                                </Button>
                              ) : (
                                <>
                                  <Button 
                                    onClick={() => updateArticle.mutate({ 
                                      articleId: selectedArticle.id, 
                                      updates: selectedArticle 
                                    })}
                                    disabled={updateArticle.isPending}
                                  >
                                    Save Changes
                                  </Button>
                                  <Button variant="outline" onClick={() => setEditMode(false)}>
                                    Cancel
                                  </Button>
                                </>
                              )}
                            </div>
                            
                            {/* Social Media Links */}
                            {selectedArticle.shareLinks && (
                              <div>
                                <label className="font-semibold">Social Media Links:</label>
                                <div className="grid grid-cols-2 gap-2 mt-2">
                                  {Object.entries(selectedArticle.shareLinks).map(([platform, url]) => (
                                    <a 
                                      key={platform}
                                      href={url} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-2 p-2 border rounded hover:bg-muted"
                                    >
                                      <ExternalLink className="w-4 h-4" />
                                      {platform.charAt(0).toUpperCase() + platform.slice(1)}
                                    </a>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                    
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => deleteArticle.mutate(article.id)}
                      disabled={deleteArticle.isPending}
                      data-testid={`delete-${article.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                <h3 className="font-bold mb-2 line-clamp-2" data-testid={`title-${article.id}`}>
                  {article.title}
                </h3>
                
                <p className="text-muted-foreground mb-4 line-clamp-2">
                  {article.excerpt}
                </p>
                
                <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(article.publishedAt)}
                    </span>
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {article.author}
                    </span>
                  </div>
                </div>
                
                {article.approvedBy && (
                  <div className="text-sm text-green-600 mb-4">
                    ✓ Approved by {article.approvedBy} on {formatDate(article.approvedAt!)}
                  </div>
                )}
                
                <div className="flex gap-2">
                  {article.status === 'pending_approval' && (
                    <Button 
                      size="sm" 
                      onClick={() => handleApprove(article.id)}
                      disabled={approveArticle.isPending}
                      data-testid={`approve-${article.id}`}
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Approve
                    </Button>
                  )}
                  
                  {article.status === 'approved' && (
                    <Button 
                      size="sm" 
                      onClick={() => handlePublish(article.id)}
                      disabled={publishArticle.isPending}
                      data-testid={`publish-${article.id}`}
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Publish
                    </Button>
                  )}
                  
                  {article.status === 'published' && !article.socialMediaShared && (
                    <Button 
                      size="sm" 
                      onClick={() => handleShare(article.id)}
                      disabled={shareToSocialMedia.isPending}
                      data-testid={`share-${article.id}`}
                    >
                      <Share2 className="w-4 h-4 mr-1" />
                      Share to Social Media
                    </Button>
                  )}
                  
                  {article.socialMediaShared && (
                    <Badge variant="secondary">
                      <Share2 className="w-3 h-3 mr-1" />
                      Shared to Social Media
                    </Badge>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}