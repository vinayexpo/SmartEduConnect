import { Suspense, lazy } from "react";
import { Loader2 } from "lucide-react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

// Light public pages stay in the entry chunk; everything else is
// code-split per route so the initial download stays small.
const Pricing = lazy(() => import("./pages/Pricing"));
const AboutUs = lazy(() => import("./pages/AboutUs"));
const TermsAndConditions = lazy(() => import("./pages/TermsAndConditions"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));

// Admin Pages
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const TeachersManagement = lazy(() => import("./pages/admin/TeachersManagement"));
const StudentsManagement = lazy(() => import("./pages/admin/StudentsManagement"));
const ClassesManagement = lazy(() => import("./pages/admin/ClassesManagement"));
const SubjectsManagement = lazy(() => import("./pages/admin/SubjectsManagement"));
const TimetableManagement = lazy(() => import("./pages/admin/TimetableManagement"));
const AttendanceManagement = lazy(() => import("./pages/admin/AttendanceManagement"));
const ExamsManagement = lazy(() => import("./pages/admin/ExamsManagement"));
const AnnouncementsManagement = lazy(() => import("./pages/admin/AnnouncementsManagement"));
const LeaveManagement = lazy(() => import("./pages/admin/LeaveManagement"));
const ComplaintsManagement = lazy(() => import("./pages/admin/ComplaintsManagement"));
const FeesManagement = lazy(() => import("./pages/admin/FeesManagement"));
const CertificatesManagement = lazy(() => import("./pages/admin/CertificatesManagement"));
const AdminMessages = lazy(() => import("./pages/admin/AdminMessages"));
const SettingsPage = lazy(() => import("./pages/admin/SettingsPage"));
const LeadsManagement = lazy(() => import("./pages/admin/LeadsManagement"));
const GalleryManagement = lazy(() => import("./pages/admin/GalleryManagement"));
const SyllabusManagement = lazy(() => import("./pages/admin/SyllabusManagement"));
const AdminNotifications = lazy(() => import("./pages/admin/AdminNotifications"));
const WeeklyExamsManagement = lazy(() => import("./pages/admin/WeeklyExamsManagement"));
const AcademicCalendar = lazy(() => import("./pages/admin/AcademicCalendar"));
const StudentPromotion = lazy(() => import("./pages/admin/StudentPromotion"));
const StudentHistory = lazy(() => import("./pages/admin/StudentHistory"));
const TeacherAcademicCalendar = lazy(() => import("./pages/teacher/TeacherAcademicCalendar"));
const ParentAcademicCalendar = lazy(() => import("./pages/parent/ParentAcademicCalendar"));


// Teacher Pages
const TeacherDashboard = lazy(() => import("./pages/teacher/TeacherDashboard"));
const TeacherClasses = lazy(() => import("./pages/teacher/TeacherClasses"));
const TeacherStudents = lazy(() => import("./pages/teacher/TeacherStudents"));
const TeacherAttendance = lazy(() => import("./pages/teacher/TeacherAttendance"));
const TeacherHomework = lazy(() => import("./pages/teacher/TeacherHomework"));
const TeacherExams = lazy(() => import("./pages/teacher/TeacherExams"));
const TeacherReports = lazy(() => import("./pages/teacher/TeacherReports"));
const TeacherAnnouncements = lazy(() => import("./pages/teacher/TeacherAnnouncements"));
const TeacherLeave = lazy(() => import("./pages/teacher/TeacherLeave"));
const TeacherMessages = lazy(() => import("./pages/teacher/TeacherMessages"));
const TeacherTimetable = lazy(() => import("./pages/teacher/TeacherTimetable"));
const TeacherLeads = lazy(() => import("./pages/teacher/TeacherLeads"));
const TeacherGallery = lazy(() => import("./pages/teacher/TeacherGallery"));
const TeacherSyllabus = lazy(() => import("./pages/teacher/TeacherSyllabus"));
const TeacherWeeklyExams = lazy(() => import("./pages/teacher/TeacherWeeklyExams"));
const TeacherNotifications = lazy(() => import("./pages/teacher/TeacherNotifications"));
const TeacherSettings = lazy(() => import("./pages/teacher/TeacherSettings"));
// Parent Pages
const ParentDashboard = lazy(() => import("./pages/parent/ParentDashboard"));
const ParentChild = lazy(() => import("./pages/parent/ParentChild"));
const ParentAttendance = lazy(() => import("./pages/parent/ParentAttendance"));
const ParentTimetable = lazy(() => import("./pages/parent/ParentTimetable"));
const ParentHomework = lazy(() => import("./pages/parent/ParentHomework"));
const ParentSyllabus = lazy(() => import("./pages/parent/ParentSyllabus"));
const ParentExams = lazy(() => import("./pages/parent/ParentExams"));
const ParentProgress = lazy(() => import("./pages/parent/ParentProgress"));
const ParentAnnouncements = lazy(() => import("./pages/parent/ParentAnnouncements"));
const ParentLeave = lazy(() => import("./pages/parent/ParentLeave"));
const ParentMessages = lazy(() => import("./pages/parent/ParentMessages"));
const ParentCertificates = lazy(() => import("./pages/parent/ParentCertificates"));
const ParentFees = lazy(() => import("./pages/parent/ParentFees"));
const ParentGallery = lazy(() => import("./pages/parent/ParentGallery"));
const ParentNotifications = lazy(() => import("./pages/parent/ParentNotifications"));
const ParentSettings = lazy(() => import("./pages/parent/ParentSettings"));
const ParentComplaints = lazy(() => import("./pages/parent/ParentComplaints"));

function RouteFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/about-us" element={<AboutUs />} />

            {/* Admin Routes */}
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/teachers" element={<TeachersManagement />} />
            <Route path="/admin/students" element={<StudentsManagement />} />
            <Route path="/admin/student-history" element={<StudentHistory />} />
            <Route path="/admin/promotion" element={<StudentPromotion />} />
            <Route path="/admin/classes" element={<ClassesManagement />} />
            <Route path="/admin/subjects" element={<SubjectsManagement />} />
            <Route path="/admin/timetable" element={<TimetableManagement />} />
            <Route path="/admin/attendance" element={<AttendanceManagement />} />
            <Route path="/admin/exams" element={<ExamsManagement />} />
            <Route path="/admin/syllabus" element={<SyllabusManagement />} />

            <Route path="/admin/announcements" element={<AnnouncementsManagement />} />
            <Route path="/admin/leave" element={<LeaveManagement />} />
            <Route path="/admin/complaints" element={<ComplaintsManagement />} />
            <Route path="/admin/fees" element={<FeesManagement />} />
            <Route path="/admin/certificates" element={<CertificatesManagement />} />
            <Route path="/admin/messages" element={<AdminMessages />} />
            <Route path="/admin/leads" element={<LeadsManagement />} />
            <Route path="/admin/gallery" element={<GalleryManagement />} />
            <Route path="/admin/notifications" element={<AdminNotifications />} />
            <Route path="/admin/weekly-exams" element={<WeeklyExamsManagement />} />
            <Route path="/admin/academic-calendar" element={<AcademicCalendar />} />
            <Route path="/admin/holiday-calendar" element={<AcademicCalendar />} />
            <Route path="/admin/settings" element={<SettingsPage />} />

            {/* Teacher Routes */}
            <Route path="/teacher" element={<TeacherDashboard />} />
            <Route path="/teacher/classes" element={<TeacherClasses />} />
            <Route path="/teacher/students" element={<TeacherStudents />} />
            <Route path="/teacher/attendance" element={<TeacherAttendance />} />
            <Route path="/teacher/homework" element={<TeacherHomework />} />
            <Route path="/teacher/exams" element={<TeacherExams />} />
            <Route path="/teacher/reports" element={<TeacherReports />} />
            <Route path="/teacher/announcements" element={<TeacherAnnouncements />} />
            <Route path="/teacher/leave" element={<TeacherLeave />} />
            <Route path="/teacher/timetable" element={<TeacherTimetable />} />
            <Route path="/teacher/leads" element={<TeacherLeads />} />
            <Route path="/teacher/gallery" element={<TeacherGallery />} />
            <Route path="/teacher/syllabus" element={<TeacherSyllabus />} />
            <Route path="/teacher/weekly-exams" element={<TeacherWeeklyExams />} />
            <Route path="/teacher/notifications" element={<TeacherNotifications />} />
            <Route path="/teacher/messages" element={<TeacherMessages />} />
            <Route path="/teacher/settings" element={<TeacherSettings />} />
            <Route path="/teacher/academic-calendar" element={<TeacherAcademicCalendar />} />
            <Route path="/teacher/holiday-calendar" element={<TeacherAcademicCalendar />} />

            {/* Parent Routes */}
            <Route path="/parent" element={<ParentDashboard />} />
            <Route path="/parent/child" element={<ParentChild />} />
            <Route path="/parent/attendance" element={<ParentAttendance />} />
            <Route path="/parent/timetable" element={<ParentTimetable />} />
            <Route path="/parent/homework" element={<ParentHomework />} />
            <Route path="/parent/syllabus" element={<ParentSyllabus />} />
            <Route path="/parent/exams" element={<ParentExams />} />
            <Route path="/parent/progress" element={<ParentProgress />} />
            <Route path="/parent/announcements" element={<ParentAnnouncements />} />
            <Route path="/parent/leave" element={<ParentLeave />} />
            <Route path="/parent/messages" element={<ParentMessages />} />
            <Route path="/parent/certificates" element={<ParentCertificates />} />
            <Route path="/parent/gallery" element={<ParentGallery />} />
            <Route path="/parent/notifications" element={<ParentNotifications />} />
            <Route path="/parent/fees" element={<ParentFees />} />
            <Route path="/parent/complaints" element={<ParentComplaints />} />
            <Route path="/parent/settings" element={<ParentSettings />} />
            <Route path="/parent/academic-calendar" element={<ParentAcademicCalendar />} />
            <Route path="/parent/holiday-calendar" element={<ParentAcademicCalendar />} />

            {/* Public Routes */}
            <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />

            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
