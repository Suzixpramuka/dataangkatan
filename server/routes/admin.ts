import { Router, Response } from "express";
import { z } from "zod";
import ExcelJS from "exceljs";
import { stringify } from "csv-stringify/sync";
import { Storage, sanitizeForCsv } from "../storage.ts";
import {
  AuthenticatedRequest,
  requireAdmin,
  requireSuperAdmin,
} from "../middleware/auth.ts";
import { evaluateStudentMatching, normalizeText } from "../verification.ts";
import { UserRecord, VerificationStatus } from "../types.ts";

const router = Router();

// Apply requireAdmin to all routes here
router.use(requireAdmin);

// Realtime Stats
router.get("/stats", (req: AuthenticatedRequest, res: Response) => {
  const users = Storage.getUsers().filter(
    (u) => !u.deleted && u.role === "MEMBER",
  );
  const official = Storage.getOfficialStudents().filter((o) => o.active);

  const registeredNims = new Set(users.map((u) => u.nim.trim()));
  const unregisteredOfficial = official.filter(
    (o) => !registeredNims.has(o.nim.trim()),
  );

  const stats = {
    totalMembers: users.length,
    verified: users.filter((u) => u.status === "VERIFIED").length,
    pending: users.filter((u) => u.status === "PENDING").length,
    needsConfirmation: users.filter((u) => u.status === "NEEDS_CONFIRMATION")
      .length,
    notVerified: users.filter((u) => u.status === "NOT_VERIFIED").length,
    duplicateReview: users.filter((u) => u.status === "DUPLICATE_REVIEW")
      .length,
    totalOfficial: official.length,
    unregisteredCount: unregisteredOfficial.length,
    classDistribution: {} as Record<string, number>,
    statusDistribution: {
      VERIFIED: users.filter((u) => u.status === "VERIFIED").length,
      PENDING: users.filter((u) => u.status === "PENDING").length,
      NEEDS_CONFIRMATION: users.filter((u) => u.status === "NEEDS_CONFIRMATION")
        .length,
      NOT_VERIFIED: users.filter((u) => u.status === "NOT_VERIFIED").length,
      DUPLICATE_REVIEW: users.filter((u) => u.status === "DUPLICATE_REVIEW")
        .length,
    },
    deletedCount: Storage.getUsers().filter((u) => u.deleted).length,
  };

  for (const u of users) {
    const k = u.kelas ? u.kelas.toUpperCase() : "Belum Ada";
    stats.classDistribution[k] = (stats.classDistribution[k] || 0) + 1;
  }

  res.json(stats);
});

// Member list with server-side pagination, search, filters, sorting
router.get("/members", (req: AuthenticatedRequest, res: Response) => {
  const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
  const limit = Math.min(
    200,
    Math.max(1, parseInt(req.query.limit as string, 10) || 20),
  );
  const search = ((req.query.search as string) || "").trim().toLowerCase();
  const statusFilter = (req.query.status as string) || "ALL";
  const classFilter = (req.query.kelas as string) || "ALL";
  const showDeleted = req.query.showDeleted === "true";
  const sortBy = (req.query.sortBy as string) || "created_at";
  const sortDir = (req.query.sortDir as string) === "asc" ? "asc" : "desc";

  let list = Storage.getUsers().filter((u) => u.role === "MEMBER");

  if (!showDeleted) {
    list = list.filter((u) => !u.deleted);
  } else {
    list = list.filter((u) => u.deleted);
  }

  if (statusFilter !== "ALL") {
    list = list.filter((u) => u.status === statusFilter);
  }

  // if (classFilter !== "ALL") {
  //   list = list.filter(
  //     (u) => (u.kelas || "").toUpperCase() === classFilter.toUpperCase(),
  //   );
  // }

  if (search) {
    list = list.filter(
      (u) =>
        u.nama.toLowerCase().includes(search) ||
        u.nim.includes(search) ||
        (u.email && u.email.toLowerCase().includes(search)) ||
        (u.wa_number && u.wa_number.includes(search)) ||
        (u.wa_display_name &&
          u.wa_display_name.toLowerCase().includes(search)) ||
        (u.instagram && u.instagram.toLowerCase().includes(search)),
    );
  }

  // Sort
  list.sort((a, b) => {
    const valA = String(
      (a as unknown as Record<string, unknown>)[sortBy] ?? "",
    );
    const valB = String(
      (b as unknown as Record<string, unknown>)[sortBy] ?? "",
    );
    const cmp = valA.localeCompare(valB);
    return sortDir === "asc" ? cmp : -cmp;
  });

  const total = list.length;
  const totalPages = Math.ceil(total / limit) || 1;
  const startIndex = (page - 1) * limit;
  const items = list.slice(startIndex, startIndex + limit).map((u) => ({
    id: u.id,
    role: u.role,
    email: u.email,
    nama: u.nama,
    nim: u.nim,
    // kelas: u.kelas,
    program_studi: u.program_studi,
    angkatan: u.angkatan,
    wa_number: u.wa_number,
    wa_display_name: u.wa_display_name,
    nickname: u.nickname,
    instagram: u.instagram,
    status: u.status,
    admin_note: u.admin_note,
    member_message: u.member_message,
    submit_count: u.submit_count,
    deleted: u.deleted,
    deleted_reason: u.deleted_reason,
    created_at: u.created_at,
    updated_at: u.updated_at,
  }));

  res.json({
    items,
    total,
    page,
    totalPages,
    limit,
  });
});

// Member Detail with match breakdown
router.get("/members/:id", (req: AuthenticatedRequest, res: Response) => {
  const user = Storage.findUserById(req.params.id);
  if (!user) {
    res.status(404).json({ message: "Mahasiswa tidak ditemukan." });
    return;
  }

  const evalResult = evaluateStudentMatching({
    id: user.id,
    nama: user.nama,
    nim: user.nim,
    // kelas: user.kelas,
    program_studi: user.program_studi,
    angkatan: user.angkatan,
    wa_number: user.wa_number,
  });

  const officialMatch = Storage.findOfficialByNim(user.nim);
  const rosterMatch = user.wa_number
    ? Storage.findRosterByWa(user.wa_number)
    : undefined;

  // Find other accounts with same NIM or WA for duplicate inspection
  const duplicateAccounts = Storage.getUsers()
    .filter(
      (u) =>
        u.id !== user.id &&
        !u.deleted &&
        (u.nim.trim() === user.nim.trim() ||
          (user.wa_number && u.wa_number && u.wa_number === user.wa_number)),
    )
    .map((u) => ({
      id: u.id,
      nama: u.nama,
      nim: u.nim,
      wa_number: u.wa_number,
      status: u.status,
      created_at: u.created_at,
    }));

  res.json({
    member: user,
    evaluation: evalResult,
    officialRecord: officialMatch || null,
    rosterRecord: rosterMatch || null,
    duplicateAccounts,
  });
});

// Update Status & Notes
const updateStatusSchema = z.object({
  status: z.enum([
    "VERIFIED",
    "NEEDS_CONFIRMATION",
    "NOT_VERIFIED",
    "PENDING",
    "DUPLICATE_REVIEW",
  ]),
  admin_note: z.string().optional(),
  member_message: z.string().optional(),
});

router.post(
  "/members/:id/status",
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const parseResult = updateStatusSchema.safeParse(req.body);
      if (!parseResult.success) {
        res.status(400).json({ message: "Status tidak valid." });
        return;
      }

      const { status, admin_note, member_message } = parseResult.data;
      const user = Storage.findUserById(req.params.id);
      if (!user) {
        res.status(404).json({ message: "Mahasiswa tidak ditemukan." });
        return;
      }

      const prevStatus = user.status;
      const updated = await Storage.updateUser(user.id, {
        status,
        admin_note: admin_note !== undefined ? admin_note : user.admin_note,
        member_message:
          member_message !== undefined ? member_message : user.member_message,
      });

      await Storage.addAuditLog({
        actor_id: req.user!.id,
        actor_name: req.user!.nama,
        actor_role: req.user!.role,
        action: "UPDATE_VERIFICATION_STATUS",
        target_id: user.id,
        description: `Mengubah status verifikasi mahasiswa ${user.nama} (${user.nim}) dari ${prevStatus} menjadi ${status}. Catatan: ${admin_note || "-"}`,
      });

      res.json({
        message: `Status berhasil diubah menjadi ${status}`,
        member: updated,
      });
    } catch (error) {
      console.error("Update status error:", error);
      res.status(500).json({ message: "Gagal memperbarui status verifikasi." });
    }
  },
);

// Delete / Soft Delete Anomaly Member
const deleteSchema = z.object({
  reason: z
    .string()
    .min(3, "Alasan penghapusan wajib diisi (minimal 3 karakter)"),
});

router.delete(
  "/members/:id",
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const parseResult = deleteSchema.safeParse(req.body);
      if (!parseResult.success) {
        const issues = (parseResult.error as any).issues || [];
        res
          .status(400)
          .json({ message: issues[0]?.message || "Alasan wajib diisi." });
        return;
      }

      const { reason } = parseResult.data;
      const user = Storage.findUserById(req.params.id);
      if (!user) {
        res.status(404).json({ message: "Mahasiswa tidak ditemukan." });
        return;
      }

      if (user.role === "SUPER_ADMIN") {
        res
          .status(403)
          .json({ message: "Akun Super Admin tidak dapat dihapus." });
        return;
      }

      await Storage.softDeleteUser(user.id, reason);

      await Storage.addAuditLog({
        actor_id: req.user!.id,
        actor_name: req.user!.nama,
        actor_role: req.user!.role,
        action: "SOFT_DELETE_MEMBER",
        target_id: user.id,
        description: `Menghapus (soft delete) data mahasiswa ${user.nama} (${user.nim}). Alasan: ${reason}`,
      });

      res.json({
        message: "Data mahasiswa berhasil dipindahkan ke arsip/dihapus.",
      });
    } catch (error) {
      console.error("Delete error:", error);
      res.status(500).json({ message: "Gagal menghapus data mahasiswa." });
    }
  },
);

// Restore deleted member (Super Admin only)
router.post(
  "/members/:id/restore",
  requireSuperAdmin,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = Storage.findUserById(req.params.id);
      if (!user) {
        res.status(404).json({ message: "Mahasiswa tidak ditemukan." });
        return;
      }

      await Storage.restoreUser(user.id);

      await Storage.addAuditLog({
        actor_id: req.user!.id,
        actor_name: req.user!.nama,
        actor_role: req.user!.role,
        action: "RESTORE_MEMBER",
        target_id: user.id,
        description: `Memulihkan data mahasiswa terhapus: ${user.nama} (${user.nim})`,
      });

      res.json({ message: "Data mahasiswa berhasil dipulihkan." });
    } catch (error) {
      console.error("Restore error:", error);
      res.status(500).json({ message: "Gagal memulihkan data." });
    }
  },
);

// Bulk Delete
const bulkDeleteSchema = z.object({
  ids: z.array(z.string()).min(1, "Pilih minimal satu data untuk dihapus"),
  reason: z.string().min(3, "Alasan penghapusan massal wajib diisi"),
});

router.post(
  "/members/bulk-delete",
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const parseResult = bulkDeleteSchema.safeParse(req.body);
      if (!parseResult.success) {
        res.status(400).json({ message: "Input tidak valid." });
        return;
      }

      const { ids, reason } = parseResult.data;
      let deletedCount = 0;

      for (const id of ids) {
        const u = Storage.findUserById(id);
        if (u && u.role === "MEMBER" && !u.deleted) {
          await Storage.softDeleteUser(id, reason);
          deletedCount++;
        }
      }

      await Storage.addAuditLog({
        actor_id: req.user!.id,
        actor_name: req.user!.nama,
        actor_role: req.user!.role,
        action: "BULK_DELETE_MEMBERS",
        target_id: `COUNT_${deletedCount}`,
        description: `Menghapus massal ${deletedCount} mahasiswa. Alasan: ${reason}`,
      });

      res.json({
        message: `Berhasil menghapus ${deletedCount} data mahasiswa.`,
      });
    } catch (error) {
      console.error("Bulk delete error:", error);
      res.status(500).json({ message: "Gagal melakukan penghapusan massal." });
    }
  },
);

// Tab: Belum Mendaftar (Official Students who haven't registered)
router.get("/unregistered", (req: AuthenticatedRequest, res: Response) => {
  const users = Storage.getUsers().filter((u) => !u.deleted);
  const registeredNims = new Set(users.map((u) => u.nim.trim()));
  const official = Storage.getOfficialStudents().filter((o) => o.active);

  const unregistered = official
    .filter((o) => !registeredNims.has(o.nim.trim()))
    .map((o) => ({
      id: o.id,
      nama: o.nama,
      nim: o.nim,
      // kelas: o.kelas,
      program_studi: o.program_studi,
      angkatan: o.angkatan,
    }));

  res.json({
    total: unregistered.length,
    items: unregistered,
  });
});

// Tab: Duplikat (Duplicate Reviews)
router.get("/duplicates", (req: AuthenticatedRequest, res: Response) => {
  const users = Storage.getUsers().filter(
    (u) => !u.deleted && u.role === "MEMBER",
  );
  const duplicateUsers = users.filter((u) => u.status === "DUPLICATE_REVIEW");

  const detailedList = duplicateUsers.map((u) => {
    const matchingNimAccounts = users.filter(
      (other) => other.id !== u.id && other.nim === u.nim,
    );
    const matchingWaAccounts = users.filter(
      (other) =>
        other.id !== u.id && other.wa_number && other.wa_number === u.wa_number,
    );

    return {
      member: u,
      duplicateNims: matchingNimAccounts.map((m) => ({
        id: m.id,
        nama: m.nama,
        nim: m.nim,
        email: m.email,
      })),
      duplicateWas: matchingWaAccounts.map((m) => ({
        id: m.id,
        nama: m.nama,
        wa: m.wa_number,
        email: m.email,
      })),
    };
  });

  res.json({
    total: detailedList.length,
    items: detailedList,
  });
});

// Export CSV
router.get("/export/csv", (req: AuthenticatedRequest, res: Response) => {
  const statusFilter = (req.query.status as string) || "ALL";
  const classFilter = (req.query.kelas as string) || "ALL";

  let list = Storage.getUsers().filter(
    (u) => !u.deleted && u.role === "MEMBER",
  );
  if (statusFilter !== "ALL") {
    list = list.filter((u) => u.status === statusFilter);
  }
  if (classFilter !== "ALL") {
    list = list.filter(
      (u) => (u.kelas || "").toUpperCase() === classFilter.toUpperCase(),
    );
  }

  const rows = list.map((u, idx) => ({
    No: idx + 1,
    "Nama Lengkap": sanitizeForCsv(u.nama),
    NIM: sanitizeForCsv(u.nim),
    // Kelas: sanitizeForCsv(u.kelas),
    "Program Studi": sanitizeForCsv(u.program_studi),
    Angkatan: sanitizeForCsv(u.angkatan),
    "Nomor WhatsApp": sanitizeForCsv(u.wa_number),
    "Nama di Grup WA": sanitizeForCsv(u.wa_display_name),
    "Nama Panggilan": sanitizeForCsv(u.nickname),
    Instagram: sanitizeForCsv(u.instagram),
    "Status Verifikasi": sanitizeForCsv(u.status),
    "Catatan Admin": sanitizeForCsv(u.admin_note),
    "Pesan untuk Mahasiswa": sanitizeForCsv(u.member_message),
    "Tanggal Daftar": sanitizeForCsv(u.created_at),
  }));

  const csvContent = stringify(rows, { header: true });

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="IF26_Anggota_${new Date().toISOString().slice(0, 10)}.csv"`,
  );
  res.send("\uFEFF" + csvContent); // Add UTF-8 BOM for Excel compatibility
});

// Export XLSX
router.get("/export/xlsx", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const statusFilter = (req.query.status as string) || "ALL";
    const classFilter = (req.query.kelas as string) || "ALL";

    let list = Storage.getUsers().filter(
      (u) => !u.deleted && u.role === "MEMBER",
    );
    if (statusFilter !== "ALL") {
      list = list.filter((u) => u.status === statusFilter);
    }
    if (classFilter !== "ALL") {
      list = list.filter(
        (u) => (u.kelas || "").toUpperCase() === classFilter.toUpperCase(),
      );
    }

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "IF26 Member Verification System";
    workbook.created = new Date();

    const sheet = workbook.addWorksheet("Data Anggota IF26");

    sheet.columns = [
      { header: "No", key: "no", width: 6 },
      { header: "Nama Lengkap", key: "nama", width: 28 },
      { header: "NIM", key: "nim", width: 16 },
      // { header: "Kelas", key: "kelas", width: 10 },
      { header: "Program Studi", key: "prodi", width: 16 },
      { header: "Angkatan", key: "angkatan", width: 12 },
      { header: "No WhatsApp", key: "wa", width: 18 },
      { header: "Nama di Grup WA", key: "wa_name", width: 22 },
      { header: "Instagram", key: "ig", width: 16 },
      { header: "Status Verifikasi", key: "status", width: 22 },
      { header: "Catatan Admin", key: "admin_note", width: 30 },
      { header: "Tanggal Daftar", key: "created_at", width: 18 },
    ];

    // Style header row
    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF1E3A8A" }, // Navy blue
    };
    headerRow.alignment = { vertical: "middle", horizontal: "center" };

    list.forEach((u, i) => {
      sheet.addRow({
        no: i + 1,
        nama: sanitizeForCsv(u.nama),
        nim: sanitizeForCsv(u.nim),
        // kelas: sanitizeForCsv(u.kelas),
        prodi: sanitizeForCsv(u.program_studi),
        angkatan: sanitizeForCsv(u.angkatan),
        wa: sanitizeForCsv(u.wa_number),
        wa_name: sanitizeForCsv(u.wa_display_name),
        ig: sanitizeForCsv(u.instagram),
        status: sanitizeForCsv(u.status),
        admin_note: sanitizeForCsv(u.admin_note),
        created_at: u.created_at ? u.created_at.slice(0, 10) : "",
      });
    });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="IF26_Anggota_${new Date().toISOString().slice(0, 10)}.xlsx"`,
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("Export XLSX error:", error);
    res.status(500).json({ message: "Gagal mengekspor data ke format Excel." });
  }
});

export default router;
