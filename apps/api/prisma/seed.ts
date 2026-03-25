import { PrismaClient } from "@prisma/client";
import { randomBytes, scryptSync } from "crypto";

const prisma = new PrismaClient();

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

async function main() {
  console.log("Seeding database...");

  // Permissions
  const permissionSlugs = [
    "users.view",
    "users.create",
    "users.edit",
    "users.delete",
    "groups.view",
    "groups.create",
    "groups.edit",
    "groups.delete",
    "forms.view",
    "forms.create",
    "forms.edit",
    "forms.delete",
    "forms.submit",
    "workflows.view",
    "workflows.create",
    "workflows.edit",
    "workflows.delete",
    "workflows.transition",
    "uploads.view",
    "uploads.create",
    "uploads.delete",
    "notifications.view",
    "audit.view",
  ];

  for (const slug of permissionSlugs) {
    await prisma.permission.upsert({
      where: { slug },
      update: {},
      create: {
        slug,
        name: slug
          .replace(".", " ")
          .replace(/\b\w/g, (c) => c.toUpperCase()),
      },
    });
  }
  console.log(`  ${permissionSlugs.length} permissions upserted`);

  // Groups
  const adminGroup = await prisma.group.upsert({
    where: { name: "Admin" },
    update: {},
    create: { name: "Admin" },
  });

  const editorGroup = await prisma.group.upsert({
    where: { name: "Editor" },
    update: {},
    create: { name: "Editor" },
  });

  const viewerGroup = await prisma.group.upsert({
    where: { name: "Viewer" },
    update: {},
    create: { name: "Viewer" },
  });
  console.log("  3 groups upserted (Admin, Editor, Viewer)");

  // Assign all permissions to Admin
  const allPermissions = await prisma.permission.findMany();
  for (const perm of allPermissions) {
    await prisma.groupPermission.upsert({
      where: {
        groupId_permissionId: {
          groupId: adminGroup.id,
          permissionId: perm.id,
        },
      },
      update: {},
      create: { groupId: adminGroup.id, permissionId: perm.id },
    });
  }

  // Assign view permissions to Editor + some edit
  const editorSlugs = permissionSlugs.filter(
    (s) => s.includes(".view") || s.includes(".create") || s.includes(".edit") || s.includes(".submit") || s.includes(".transition"),
  );
  for (const slug of editorSlugs) {
    const perm = allPermissions.find((p) => p.slug === slug);
    if (!perm) continue;
    await prisma.groupPermission.upsert({
      where: {
        groupId_permissionId: {
          groupId: editorGroup.id,
          permissionId: perm.id,
        },
      },
      update: {},
      create: { groupId: editorGroup.id, permissionId: perm.id },
    });
  }

  // Assign view-only to Viewer
  const viewerSlugs = permissionSlugs.filter((s) => s.includes(".view"));
  for (const slug of viewerSlugs) {
    const perm = allPermissions.find((p) => p.slug === slug);
    if (!perm) continue;
    await prisma.groupPermission.upsert({
      where: {
        groupId_permissionId: {
          groupId: viewerGroup.id,
          permissionId: perm.id,
        },
      },
      update: {},
      create: { groupId: viewerGroup.id, permissionId: perm.id },
    });
  }
  console.log("  Permissions assigned to groups");

  // Admin user
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@boilerworks.dev" },
    update: {},
    create: {
      email: "admin@boilerworks.dev",
      name: "Admin User",
      passwordHash: hashPassword("admin123"),
      isSuperuser: true,
      isStaff: true,
    },
  });

  await prisma.userGroup.upsert({
    where: {
      userId_groupId: { userId: adminUser.id, groupId: adminGroup.id },
    },
    update: {},
    create: { userId: adminUser.id, groupId: adminGroup.id },
  });

  // Editor user
  const editorUser = await prisma.user.upsert({
    where: { email: "editor@boilerworks.dev" },
    update: {},
    create: {
      email: "editor@boilerworks.dev",
      name: "Editor User",
      passwordHash: hashPassword("editor123"),
    },
  });

  await prisma.userGroup.upsert({
    where: {
      userId_groupId: { userId: editorUser.id, groupId: editorGroup.id },
    },
    update: {},
    create: { userId: editorUser.id, groupId: editorGroup.id },
  });

  // Viewer user
  const viewerUser = await prisma.user.upsert({
    where: { email: "viewer@boilerworks.dev" },
    update: {},
    create: {
      email: "viewer@boilerworks.dev",
      name: "Viewer User",
      passwordHash: hashPassword("viewer123"),
    },
  });

  await prisma.userGroup.upsert({
    where: {
      userId_groupId: { userId: viewerUser.id, groupId: viewerGroup.id },
    },
    update: {},
    create: { userId: viewerUser.id, groupId: viewerGroup.id },
  });

  console.log("  3 users seeded (admin, editor, viewer)");
  console.log("Done.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
