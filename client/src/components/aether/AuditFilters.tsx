import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface AuditFiltersProps {
  severity: string;
  category: string;
  page: string;
  onSeverityChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onPageChange: (value: string) => void;
}

export default function AuditFilters({
  severity,
  category,
  page,
  onSeverityChange,
  onCategoryChange,
  onPageChange
}: AuditFiltersProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-lg bg-muted/50" data-testid="filters-audit">
      <div className="space-y-2">
        <Label htmlFor="filter-severity">Severity</Label>
        <Select value={severity} onValueChange={onSeverityChange}>
          <SelectTrigger id="filter-severity" data-testid="select-severity">
            <SelectValue placeholder="All severities" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All severities</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="filter-category">Category</Label>
        <Select value={category} onValueChange={onCategoryChange}>
          <SelectTrigger id="filter-category" data-testid="select-category">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            <SelectItem value="indexability">Indexability</SelectItem>
            <SelectItem value="schema">Schema</SelectItem>
            <SelectItem value="content">Content</SelectItem>
            <SelectItem value="performance">Performance</SelectItem>
            <SelectItem value="geo">GEO Visibility</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="filter-page">Page</Label>
        <Input
          id="filter-page"
          placeholder="Filter by page..."
          value={page}
          onChange={(e) => onPageChange(e.target.value)}
          data-testid="input-page-filter"
        />
      </div>
    </div>
  );
}
