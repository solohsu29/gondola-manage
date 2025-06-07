const { PrismaClient } = require('@prisma/client');
const { randomUUID } = require('crypto');
const prisma = new PrismaClient();

async function main() {
  // Create Projects
  const project1 = await prisma.project.create({
    data: {
      client: 'Acme Corp',
      site: 'Downtown',
      gondolas: 2,
      created: new Date('2024-01-15'),
      status: 'active',
      endDate: null
    }
  });
  const project2 = await prisma.project.create({
    data: {
      client: 'Globex Ltd',
      site: 'Harbor',
      gondolas: 1,
      created: new Date('2024-02-10'),
      status: 'completed',
      endDate: new Date('2024-04-20')
    }
  });

  // Create Gondolas
  const gondola1 = await prisma.gondola.create({
    data: {
      serialNumber: 'GND-001-2023',
      location: 'Downtown',
      locationDetail: 'Tower A',
      lastInspection: new Date('2024-03-01'),
      nextInspection: new Date('2024-09-01'),
      status: 'deployed',
      photoName: 'gondola1.jpg',
    }
  });
  const gondola2 = await prisma.gondola.create({
    data: {
      serialNumber: 'GND-002-2023',
      location: 'Harbor',
      locationDetail: 'Dock 3',
      lastInspection: new Date('2024-02-01'),
      nextInspection: new Date('2024-08-01'),
      status: 'deployed',
      photoName: 'gondola2.jpg',
    }
  });

  // Create Delivery Orders
  await prisma.deliveryOrder.createMany({
    data: [
      {
        id: randomUUID(),
        projectId: project1.id,
        number: 'DO-001',
        date: new Date('2024-01-20'),
        fileUrl: null,
        client: 'Acme Corp',
        site: 'Downtown',
        orderDate: new Date('2024-01-18'),
        deliveryDate: new Date('2024-01-25'),
        poReference: 'PO-123',
        status: 'delivered',
        amount: '10000',
        items: 2
      },
      {
        id: randomUUID(),
        projectId: project2.id,
        number: 'DO-002',
        date: new Date('2024-02-15'),
        fileUrl: null,
        client: 'Globex Ltd',
        site: 'Harbor',
        orderDate: new Date('2024-02-12'),
        deliveryDate: new Date('2024-02-20'),
        poReference: 'PO-456',
        status: 'pending',
        amount: '5000',
        items: 1
      }
    ]
  });

  // Create Documents
  await prisma.document.createMany({
    data: [
      {
        id: randomUUID(),
        gondolaId: gondola1.id,
        type: 'Manual',
        name: 'User Manual.pdf',
        uploaded: new Date('2024-01-18'),
        expiry: new Date('2025-01-18'),
        status: 'Valid',
        filePath: '/backend/docs/user-manual.pdf',
        fileData: Buffer.from('Sample PDF content')
      },
      {
        id: randomUUID(),
        gondolaId: gondola2.id,
        type: 'Inspection',
        name: 'Inspection Report.docx',
        uploaded: new Date('2024-02-01'),
        expiry: new Date('2025-02-01'),
        status: 'Expiring',
        filePath: '/backend/docs/inspection-report.docx',
        fileData: Buffer.from('Sample DOCX content')
      }
    ]
  });

  // Create Shift History
  await prisma.shiftHistory.createMany({
    data: [
      {
        id: randomUUID(),
        gondolaId: gondola1.id,
        fromLocation: 'Downtown',
        fromLocationDetail: 'Tower A',
        toLocation: 'Downtown',
        toLocationDetail: 'Tower B',
        shiftDate: new Date('2024-04-01'),
        reason: 'Routine move',
        notes: 'No issues',
        shiftedBy: 'John Doe',
        createdAt: new Date('2024-04-01')
      },
      {
        id: randomUUID(),
        gondolaId: gondola2.id,
        fromLocation: 'Harbor',
        fromLocationDetail: 'Dock 3',
        toLocation: 'Harbor',
        toLocationDetail: 'Dock 4',
        shiftDate: new Date('2024-05-01'),
        reason: 'Maintenance',
        notes: 'Cable replaced',
        shiftedBy: 'Jane Smith',
        createdAt: new Date('2024-05-01')
      }
    ]
  });

  // Create Certificates
  await prisma.certificate.createMany({
    data: [
      {
        id: randomUUID(),
        gondolaId: gondola1.id,
        title: 'LEW Certificate',
        status: 'Expired',
        expiryDate: new Date('2024-04-01')
      },
      {
        id: randomUUID(),
        gondolaId: gondola2.id,
        title: 'MOM Certificate',
        status: 'Expires in 30 days',
        expiryDate: new Date('2024-06-30')
      }
    ]
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
