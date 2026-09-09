import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/lib/apiClient';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { adminSidebarItems } from '@/config/adminSidebar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Loader2, Eye, User, Calendar, MapPin, Phone, Heart, AlertCircle, GraduationCap, Plus, Upload, Copy, Check, Download, Pencil, Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import AttendanceSummary from '@/components/AttendanceSummary';
import { BackButton } from '@/components/ui/back-button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import DataPagination from '@/components/DataPagination';
import { buildListQuery, unwrapList, useDebouncedValue, type PageMeta } from '@/lib/paginatedApi';
import TemplateImportDialog, { type TemplateColumn } from '@/components/TemplateImportDialog';
import { downloadCSV } from '@/lib/csvExport';

interface Student {
  id: number;
  admission_number: string;
  full_name: string;
  date_of_birth: string | null;
  address: string | null;
  photo_url: string | null;
  status: string;
  class_id: number | null;
  blood_group: string | null;
  parent_name: string | null;
  parent_phone: string | null;
  emergency_contact: string | null;
  emergency_contact_name: string | null;
  classes: { name: string; section: string } | null;
}

interface ClassItem {
  id: number;
  name: string;
  section: string;
}

export default function StudentsManagement() {
  const { user, userRole, loading } = useAuth();
  const navigate = useNavigate();

  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const [meta, setMeta] = useState<PageMeta | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const debouncedSearch = useDebouncedValue(searchQuery);

  const STUDENT_TEMPLATE_COLUMNS: TemplateColumn[] = [
    { header: 'Full Name', key: 'full_name', sample: 'Aarav Sharma', required: true },
    { header: 'Class', key: 'class', sample: '5 - A', required: true },
    { header: 'Password', key: 'password', sample: 'parent123', required: true },
    { header: 'Email', key: 'email', sample: 'aarav@example.com' },
    { header: 'Date of Birth', key: 'date_of_birth', sample: '2016-05-10' },
    { header: 'Blood Group', key: 'blood_group', sample: 'O+' },
    { header: 'Address', key: 'address', sample: '12 Main Street' },
    { header: 'Parent Name', key: 'parent_name', sample: 'Raj Sharma' },
    { header: 'Parent Phone', key: 'parent_phone', sample: '9876543210' },
    { header: 'Emergency Contact', key: 'emergency_contact', sample: '9876543211' },
    { header: 'Emergency Contact Name', key: 'emergency_contact_name', sample: 'Sita Sharma' },
  ];

  const classLabelOf = (s: Student) =>
    s.classes ? (s.classes.section ? `${s.classes.name} - ${s.classes.section}` : s.classes.name) : '';

  const handleExportCSV = async () => {
    try {
      const query = buildListQuery({
        search: debouncedSearch,
        filters: { class_id: selectedClass, status: statusFilter },
        sortBy: 'students.created_at',
        sortDir: 'desc',
      });
      const res = await apiClient.get<Student[] | { data: Student[]; meta: PageMeta }>(
        `/students/directory${query}`,
      );
      const rows = unwrapList(res).items;
      if (rows.length === 0) {
        toast.error('No students to export.');
        return;
      }
      downloadCSV(
        'students',
        ['Admission No', 'Full Name', 'Class', 'Status', 'DOB', 'Parent Name', 'Parent Phone'],
        rows.map((s) => [s.admission_number, s.full_name, classLabelOf(s), s.status, s.date_of_birth || '', s.parent_name || '', s.parent_phone || '']),
      );
      toast.success(`Exported ${rows.length} students.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Export failed.');
    }
  };
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Student | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editFormData, setEditFormData] = useState({
    full_name: '',
    date_of_birth: '',
    address: '',
    blood_group: '',
    parent_name: '',
    parent_phone: '',
    emergency_contact: '',
    emergency_contact_name: '',
    status: 'active',
    password: '',
  });
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [createdStudentId, setCreatedStudentId] = useState<string | null>(null);
  const [createdPassword, setCreatedPassword] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [previewId, setPreviewId] = useState<string>('');

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    date_of_birth: '',
    class_id: '',
    address: '',
    blood_group: '',
    parent_name: '',
    parent_phone: '',
    emergency_contact: '',
    emergency_contact_name: '',
  });

  useEffect(() => {
    if (!loading && (!user || userRole !== 'admin')) {
      navigate('/auth');
    }
  }, [user, userRole, loading, navigate]);

  useEffect(() => {
    fetchClasses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchStudents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, perPage, debouncedSearch, selectedClass, statusFilter]);

  const fetchClasses = async () => {
    try {
      const classesRes = await apiClient.get<ClassItem[]>('/classes');
      if (classesRes) setClasses(classesRes);
    } catch (error) {
      console.error('Failed to fetch classes', error);
      setClasses([]);
    }
  };

  const fetchStudents = async () => {
    setLoadingData(true);
    try {
      const query = buildListQuery({
        page,
        perPage,
        search: debouncedSearch,
        filters: { class_id: selectedClass, status: statusFilter },
        sortBy: 'students.created_at',
        sortDir: 'desc',
      });
      const res = await apiClient.get<Student[] | { data: Student[]; meta: PageMeta }>(
        `/students/directory${query}`,
      );
      const { items, meta: pageMeta } = unwrapList(res);
      setStudents(items);
      setMeta(pageMeta);
    } catch (error) {
      console.error('Failed to fetch students data', error);
      setStudents([]);
      setMeta(null);
    }

    setLoadingData(false);
  };

  const fetchData = async () => {
    await Promise.all([fetchStudents(), fetchClasses()]);
  };

  const openStudentDetails = (student: Student) => {
    setSelectedStudent(student);
    setDetailsOpen(true);
  };

  const openEditDialog = (student: Student) => {
    setEditingStudent(student);
    setEditFormData({
      full_name: student.full_name,
      date_of_birth: student.date_of_birth || '',
      address: student.address || '',
      blood_group: student.blood_group || '',
      parent_name: student.parent_name || '',
      parent_phone: student.parent_phone || '',
      emergency_contact: student.emergency_contact || '',
      emergency_contact_name: student.emergency_contact_name || '',
      status: student.status,
      password: '',
    });
    setEditDialogOpen(true);
  };

  const handleEditStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;

    if (!editFormData.full_name.trim()) {
      toast.error('Full name is required');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: Record<string, string> = {
        full_name: editFormData.full_name,
        status: editFormData.status,
      };
      for (const key of ['date_of_birth', 'address', 'blood_group', 'parent_name', 'parent_phone', 'emergency_contact', 'emergency_contact_name'] as const) {
        if (editFormData[key]) payload[key] = editFormData[key];
      }
      if (editFormData.password) {
        if (editFormData.password.length < 4) {
          toast.error('Password must be at least 4 characters');
          setIsSubmitting(false);
          return;
        }
        payload.password = editFormData.password;
      }

      await apiClient.put(`/admin/students/${editingStudent.id}`, payload);
      toast.success('Student updated successfully');
      setEditDialogOpen(false);
      setEditingStudent(null);
      fetchData();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to update student');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteStudent = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    try {
      await apiClient.delete(`/admin/students/${deleteTarget.id}`);
      toast.success('Student and their records deleted successfully');
      setDeleteTarget(null);
      fetchData();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete student');
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  // Generate student ID based on name, class, and section
  const generateStudentId = (name: string, className: string, section: string): string => {
    const namePart = name.split(' ')[0].toUpperCase().replace(/[^A-Z]/g, '');
    const classPart = className.toUpperCase().replace(/[^A-Z0-9]/g, '');
    const sectionPart = section.toUpperCase().replace(/[^A-Z]/g, '');
    return sectionPart ? `${namePart}-${classPart}-${sectionPart}` : `${namePart}-${classPart}`;
  };

  // Update preview ID when name or class changes
  const updatePreviewId = (name: string, classId: string) => {
    if (name && classId) {
      const classData = classes.find((c) => String(c.id) === classId);
      if (classData) {
        setPreviewId(generateStudentId(name, classData.name, classData.section));
        return;
      }
    }
    setPreviewId('');
  };

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let password = '';
    for (let i = 0; i < 10; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData({ ...formData, password });
  };

  const copyToClipboard = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.full_name || !formData.class_id) {
      toast.error('Please fill in the required fields (Name and Class)');
      return;
    }

    if (!formData.password || formData.password.length < 4) {
      toast.error('Please set a password (minimum 4 characters) for parent login');
      return;
    }

    setIsSubmitting(true);

    try {
      const selectedClassData = classes.find((c) => String(c.id) === formData.class_id);
      if (!selectedClassData) {
        toast.error('Invalid class selected');
        setIsSubmitting(false);
        return;
      }

      const payload = new FormData();
      payload.append('full_name', formData.full_name);
      payload.append('class_id', formData.class_id);
      payload.append('password', formData.password);
      if (formData.email) payload.append('email', formData.email);
      if (formData.date_of_birth) payload.append('date_of_birth', formData.date_of_birth);
      if (formData.address) payload.append('address', formData.address);
      if (formData.blood_group) payload.append('blood_group', formData.blood_group);
      if (formData.parent_name) payload.append('parent_name', formData.parent_name);
      if (formData.parent_phone) payload.append('parent_phone', formData.parent_phone);
      if (formData.emergency_contact) payload.append('emergency_contact', formData.emergency_contact);
      if (formData.emergency_contact_name) payload.append('emergency_contact_name', formData.emergency_contact_name);
      if (photoFile) payload.append('photo', photoFile);

      const result = await apiClient.postForm<{ student_id: string }>('/admin/students', payload);

      setCreatedStudentId(result.student_id);
      setCreatedPassword(formData.password);
      setAddDialogOpen(false);
      setSuccessDialogOpen(true);

      setFormData({
        full_name: '',
        email: '',
        password: '',
        date_of_birth: '',
        class_id: selectedClass === 'all' ? '' : selectedClass,
        address: '',
        blood_group: '',
        parent_name: '',
        parent_phone: '',
        emergency_contact: '',
        emergency_contact_name: '',
      });
      setPhotoFile(null);
      setPhotoPreview('');
      setPreviewId('');

      setPage(1);
      await fetchData();

      toast.success('Student and parent account created successfully');
    } catch (error: unknown) {
      console.error('Error creating student:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create student');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Server returns the filtered page when `meta` is present; otherwise filter locally.
  const filteredStudents = meta
    ? students
    : students.filter((s) => {
        const matchesSearch =
          s.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.admission_number.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesClass = selectedClass === 'all' || String(s.class_id) === selectedClass;
        const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
        return matchesSearch && matchesClass && matchesStatus;
      });

  const totalStudents = meta ? meta.total : filteredStudents.length;
  const totalPages = meta ? meta.last_page : 1;

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <DashboardLayout sidebarItems={adminSidebarItems} roleColor="admin">
      <div className="space-y-6 animate-fade-in">
        <BackButton to="/admin" />
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold">Students Directory</h1>
            <p className="text-muted-foreground">View and manage all student records</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setImportOpen(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Import
            </Button>
            <Button variant="outline" onClick={handleExportCSV}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button onClick={() => {
              setFormData({ ...formData, class_id: selectedClass === 'all' ? '' : selectedClass });
              setAddDialogOpen(true);
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Student
            </Button>
          </div>
        </div>

        <Card className="card-elevated">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search name, admission no, parent..." className="pl-10" value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }} />
              </div>
              <Select value={selectedClass} onValueChange={(v) => { setSelectedClass(v); setPage(1); }}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filter by class" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes</SelectItem>
                  {classes.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.section ? `${c.name} - ${c.section}` : c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card className="card-elevated">
          <CardHeader><CardTitle className="font-display">All Students ({totalStudents})</CardTitle></CardHeader>
          <CardContent>
            {loadingData ? (
              <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : filteredStudents.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>{searchQuery ? 'No students found' : 'No students added yet'}</p>
                {!searchQuery && (
                  <Button className="mt-4" onClick={() => {
                    setFormData({ ...formData, class_id: selectedClass === 'all' ? '' : selectedClass });
                    setAddDialogOpen(true);
                  }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Student
                  </Button>
                )}
              </div>
            ) : (
              <>
                {/* Mobile Cards */}
                <div className="space-y-3 sm:hidden">
                  {filteredStudents.map((student) => (
                    <div key={student.id} className="p-3 rounded-xl border bg-muted/10 space-y-2.5" onClick={() => openStudentDetails(student)}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3 min-w-0">
                          <Avatar className="h-10 w-10 shrink-0">
                            <AvatarImage src={student.photo_url || ''} />
                            <AvatarFallback className="gradient-primary text-white text-sm">{student.full_name[0]}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate">{student.full_name}</p>
                            <Badge variant="secondary" className="font-mono text-[10px] font-semibold bg-primary/10 text-primary border-primary/20 mt-0.5">
                              {student.admission_number}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Badge className={`text-[10px] ${student.status === 'active' ? 'status-active' : 'status-inactive'}`}>{student.status}</Badge>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); openStudentDetails(student); }}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); openEditDialog(student); }}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={(e) => { e.stopPropagation(); setDeleteTarget(student); }}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-1 text-xs">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <GraduationCap className="h-3 w-3 shrink-0" />
                          <span>{student.classes ? (student.classes.section ? `${student.classes.name} - ${student.classes.section}` : student.classes.name) : 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <User className="h-3 w-3 shrink-0" />
                          <span>{student.parent_name || 'No parent'}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop Table */}
                <div className="overflow-x-auto hidden sm:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead>Admission No</TableHead>
                        <TableHead>Class</TableHead>
                        <TableHead>Parent</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-[130px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredStudents.map((student) => (
                        <TableRow key={student.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar>
                                <AvatarImage src={student.photo_url || ''} />
                                <AvatarFallback className="gradient-primary text-white">{student.full_name[0]}</AvatarFallback>
                              </Avatar>
                              <span className="font-medium">{student.full_name}</span>
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-sm">{student.admission_number}</TableCell>
                          <TableCell>{student.classes ? (student.classes.section ? `${student.classes.name} - ${student.classes.section}` : student.classes.name) : 'N/A'}</TableCell>
                          <TableCell>{student.parent_name || 'N/A'}</TableCell>
                          <TableCell><Badge className={student.status === 'active' ? 'status-active' : 'status-inactive'}>{student.status}</Badge></TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <Button variant="ghost" size="icon" onClick={() => openStudentDetails(student)}>
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => openEditDialog(student)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeleteTarget(student)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
            <DataPagination
              page={meta ? meta.current_page : page}
              totalPages={totalPages}
              total={totalStudents}
              perPage={meta ? meta.per_page : perPage}
              onPageChange={setPage}
              onPerPageChange={(n) => { setPerPage(n); setPage(1); }}
            />
          </CardContent>
        </Card>

        <TemplateImportDialog
          open={importOpen}
          onOpenChange={setImportOpen}
          title="Import Students"
          description="Class must match a 'Name - Section' label from Classes. A parent login account is created for each student."
          templateFileName="student_import_template"
          sheetName="Students"
          columns={STUDENT_TEMPLATE_COLUMNS}
          endpoint="/admin/students/import"
          onSuccess={() => { setPage(1); fetchData(); }}
        />

        {/* Add Student Dialog */}
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Student</DialogTitle>
              <DialogDescription>Enter student details. Student ID will be generated automatically.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddStudent} className="space-y-4">
              {/* Photo Upload */}
              <div className="flex justify-center">
                <label className="cursor-pointer">
                  <div className="w-24 h-24 rounded-full border-2 border-dashed border-muted-foreground/50 flex items-center justify-center overflow-hidden hover:border-primary transition-colors">
                    {photoPreview ? (
                      <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <Upload className="h-8 w-8 text-muted-foreground" />
                    )}
                  </div>
                  <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                </label>
              </div>

              {/* Preview Student ID */}
              {previewId && (
                <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg text-center">
                  <Label className="text-xs text-muted-foreground">Generated Student ID (Preview)</Label>
                  <p className="font-mono text-lg font-bold text-primary">{previewId}</p>
                </div>
              )}

              {/* Basic Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label>Full Name *</Label>
                  <Input
                    value={formData.full_name}
                    onChange={(e) => {
                      const newName = e.target.value;
                      setFormData({ ...formData, full_name: newName });
                      updatePreviewId(newName, formData.class_id);
                    }}
                    placeholder="Enter full name"
                    required
                  />
                </div>
                <div>
                  <Label>Class *</Label>
                  <Select
                    value={formData.class_id}
                    onValueChange={(v) => {
                      setFormData({ ...formData, class_id: v });
                      updatePreviewId(formData.full_name, v);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select class" />
                    </SelectTrigger>
                    <SelectContent>
                      {classes.map((cls) => (
                        <SelectItem key={cls.id} value={String(cls.id)}>
                          {cls.section ? `${cls.name} - ${cls.section}` : cls.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Password (for Parent Login) *</Label>
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="Enter password"
                      required
                    />
                    <Button type="button" variant="outline" size="sm" onClick={generatePassword}>
                      Generate
                    </Button>
                  </div>
                </div>
                <div>
                  <Label>Date of Birth</Label>
                  <Input
                    type="date"
                    value={formData.date_of_birth}
                    onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Email (Optional)</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="student@school.edu"
                  />
                </div>
                <div>
                  <Label>Blood Group</Label>
                  <Select value={formData.blood_group} onValueChange={(v) => setFormData({ ...formData, blood_group: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select blood group" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A+">A+</SelectItem>
                      <SelectItem value="A-">A-</SelectItem>
                      <SelectItem value="B+">B+</SelectItem>
                      <SelectItem value="B-">B-</SelectItem>
                      <SelectItem value="AB+">AB+</SelectItem>
                      <SelectItem value="AB-">AB-</SelectItem>
                      <SelectItem value="O+">O+</SelectItem>
                      <SelectItem value="O-">O-</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-2">
                  <Label>Address</Label>
                  <Textarea
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Enter address"
                    rows={2}
                  />
                </div>
              </div>

              {/* Parent Information */}
              <div className="space-y-2">
                <h4 className="font-medium flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Parent/Guardian Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Parent's Full Name</Label>
                    <Input
                      value={formData.parent_name}
                      onChange={(e) => setFormData({ ...formData, parent_name: e.target.value })}
                      placeholder="Parent's full name"
                    />
                  </div>
                  <div>
                    <Label>Parent's Phone</Label>
                    <Input
                      value={formData.parent_phone}
                      onChange={(e) => setFormData({ ...formData, parent_phone: e.target.value })}
                      placeholder="Parent's phone number"
                    />
                  </div>
                </div>
              </div>

              {/* Emergency Contact */}
              <div className="space-y-2">
                <h4 className="font-medium flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Emergency Contact
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Contact Name</Label>
                    <Input
                      value={formData.emergency_contact_name}
                      onChange={(e) => setFormData({ ...formData, emergency_contact_name: e.target.value })}
                      placeholder="Emergency contact name"
                    />
                  </div>
                  <div>
                    <Label>Contact Phone</Label>
                    <Input
                      value={formData.emergency_contact}
                      onChange={(e) => setFormData({ ...formData, emergency_contact: e.target.value })}
                      placeholder="Emergency phone number"
                    />
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Student
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Success Dialog with Student ID and Password */}
        <Dialog open={successDialogOpen} onOpenChange={setSuccessDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-primary">
                <Check className="h-5 w-5" />
                Student Created Successfully
              </DialogTitle>
              <DialogDescription>
                Here are the student's credentials. Please save them for your records.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div className="p-4 bg-muted rounded-lg">
                <Label className="text-xs text-muted-foreground">Student ID</Label>
                <div className="flex items-center gap-2 mt-1">
                  <span className="font-mono text-lg font-bold">{createdStudentId}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => copyToClipboard(createdStudentId || '', 'id')}
                  >
                    {copiedField === 'id' ? (
                      <Check className="h-4 w-4 text-primary" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              {createdPassword && (
                <div className="p-4 bg-muted rounded-lg">
                  <Label className="text-xs text-muted-foreground">Password</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-mono text-lg font-bold">{createdPassword}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => copyToClipboard(createdPassword || '', 'password')}
                    >
                      {copiedField === 'password' ? (
                        <Check className="h-4 w-4 text-primary" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button onClick={() => setSuccessDialogOpen(false)}>Done</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Student Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Student</DialogTitle>
              <DialogDescription>
                Update details for {editingStudent?.full_name} ({editingStudent?.admission_number}).
                The class cannot be changed here — contact support for transfers.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleEditStudent} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label>Full Name *</Label>
                  <Input
                    value={editFormData.full_name}
                    onChange={(e) => setEditFormData({ ...editFormData, full_name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>Status</Label>
                  <Select value={editFormData.status} onValueChange={(v) => setEditFormData({ ...editFormData, status: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Date of Birth</Label>
                  <Input
                    type="date"
                    value={editFormData.date_of_birth}
                    onChange={(e) => setEditFormData({ ...editFormData, date_of_birth: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Blood Group</Label>
                  <Input
                    value={editFormData.blood_group}
                    onChange={(e) => setEditFormData({ ...editFormData, blood_group: e.target.value })}
                    placeholder="O+"
                  />
                </div>
                <div>
                  <Label>New Password (parent login, optional)</Label>
                  <Input
                    type="text"
                    value={editFormData.password}
                    onChange={(e) => setEditFormData({ ...editFormData, password: e.target.value })}
                    placeholder="Leave blank to keep current"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label>Address</Label>
                  <Textarea
                    value={editFormData.address}
                    onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                    rows={2}
                  />
                </div>
                <div>
                  <Label>Parent's Full Name</Label>
                  <Input
                    value={editFormData.parent_name}
                    onChange={(e) => setEditFormData({ ...editFormData, parent_name: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Parent's Phone</Label>
                  <Input
                    value={editFormData.parent_phone}
                    onChange={(e) => setEditFormData({ ...editFormData, parent_phone: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Emergency Contact Name</Label>
                  <Input
                    value={editFormData.emergency_contact_name}
                    onChange={(e) => setEditFormData({ ...editFormData, emergency_contact_name: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Emergency Contact Phone</Label>
                  <Input
                    value={editFormData.emergency_contact}
                    onChange={(e) => setEditFormData({ ...editFormData, emergency_contact: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Changes
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Student Confirmation */}
        <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete {deleteTarget?.full_name}?</AlertDialogTitle>
              <AlertDialogDescription>
                This permanently removes the student ({deleteTarget?.admission_number}) along with
                their attendance, marks, fees, leave/certificate requests, reports, and promotion
                history. Chat history is kept but unlinked. This cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => { e.preventDefault(); handleDeleteStudent(); }}
                disabled={isDeleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeleting ? 'Deleting...' : 'Delete Student'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Student Details Dialog */}
        <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Student Profile
              </DialogTitle>
            </DialogHeader>
            {selectedStudent && (
              <div className="space-y-6">
                {/* Header Section */}
                <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-xl">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={selectedStudent.photo_url || ''} />
                    <AvatarFallback className="gradient-primary text-white text-xl">
                      {selectedStudent.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="text-xl font-bold">{selectedStudent.full_name}</h2>
                    <p className="text-muted-foreground font-mono">{selectedStudent.admission_number}</p>
                    {selectedStudent.classes && (
                      <Badge className="mt-1">
                        <GraduationCap className="h-3 w-3 mr-1" />
                        {selectedStudent.classes.section ? `${selectedStudent.classes.name} - ${selectedStudent.classes.section}` : selectedStudent.classes.name}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Personal Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-3">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Date of Birth</p>
                          <p className="font-medium">
                            {selectedStudent.date_of_birth 
                              ? new Date(selectedStudent.date_of_birth).toLocaleDateString() 
                              : 'Not specified'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Heart className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Blood Group</p>
                          <p className="font-medium">{selectedStudent.blood_group || 'Not specified'}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-xs text-muted-foreground">Address</p>
                          <p className="font-medium">{selectedStudent.address || 'Not specified'}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Parent / Guardian
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-3">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Parent Name</p>
                          <p className="font-medium">{selectedStudent.parent_name || 'Not specified'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Parent Phone</p>
                          <p className="font-medium">{selectedStudent.parent_phone || 'Not specified'}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="md:col-span-2">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-destructive" />
                        Emergency Contact
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex items-center gap-3 flex-1">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">Contact Name</p>
                            <p className="font-medium">{selectedStudent.emergency_contact_name || 'Not specified'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 flex-1">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">Contact Number</p>
                            <p className="font-medium">{selectedStudent.emergency_contact || 'Not specified'}</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Attendance Summary */}
                  <Card className="md:col-span-2">
                    <CardContent className="p-0">
                      <AttendanceSummary studentId={selectedStudent.id} />
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
