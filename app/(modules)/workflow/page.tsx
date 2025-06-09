import { Card, CardContent } from "@/components/ui/card"
import Image from "next/image"

export default function WorkflowPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Gondola Management Workflow</h1>

      <Card>
        <CardContent className="p-6">
          <h2 className="text-xl font-semibold mb-4">Process Flow Diagram</h2>
          <p className="text-foreground mb-6">
            This diagram illustrates the complete workflow for gondola management, from delivery orders to deployment
            and maintenance.
          </p>

          <div className="border rounded-lg overflow-hidden">
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/WhatsApp%20Image%202025-05-22%20at%201.32.23%20PM-LaDMag5exKHrdFRqZj4lYue838yFfw.jpeg"
              alt="Gondola Management Workflow Diagram"
              width={1200}
              height={800}
              className="w-full object-contain"
            />
          </div>

          <div className="mt-8 space-y-6">
            <section>
              <h3 className="text-lg font-semibold mb-2">Initial Process</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Delivery Order from ERP system is generated</li>
                <li>Upload DO to Gondola Manager</li>
                <li>GA creates transaction in the system</li>
                <li>GA assigns DO to transaction</li>
                <li>GA creates deployment document (DD)</li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-2">Documentation</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Upload required documents (SWP, RA, MOM Cert, PE Calc)</li>
                <li>Upload pictures of gondola installation</li>
                <li>Set gondola status to Deployed</li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-2">Ongoing Processes</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Ongoing Rental: Generate monthly DDs and check certificates</li>
                <li>Shifting Process: Create shifting DD and record location details</li>
                <li>Inspection Process: Submit checklist document and review by safety officer</li>
                <li>Off-Hire Request: Create off-hire DD and upload form</li>
                <li>Adhoc Deployment: Log repairs or part replacements</li>
                <li>Orientation Session: Schedule training and log contractor attendance</li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-2">Certificate Management</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>System alerts if certificates are expired</li>
                <li>Upload COS documents when required</li>
                <li>Create DD if gondola is chargeable</li>
                <li>Set gondola status to Off-Hired when applicable</li>
              </ul>
            </section>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
