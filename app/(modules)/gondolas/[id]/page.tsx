"use client"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ChevronLeft,
  FileText,
  CheckCircle,
  
  Clock,
  MapPin,
  Calendar,
} from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation";
import { useAppStore } from "@/lib/store";
import InspectionsTab from "@/components/modules/gondolas/InspectionsTab"
import DocumentsTab from "@/components/modules/gondolas/DocumentsTab"
import PhotosTab from "@/components/modules/gondolas/PhotosTab"
import MaintenanceAdhocTab from "@/components/modules/gondolas/MaintenanceAdhocTab"
import RentalDetailsTab from "@/components/modules/gondolas/RentalDetailsTab"
import OrientationSessionTab from "@/components/modules/gondolas/OrientationSessionTab"
import ShiftHistoryTab from "@/components/modules/gondolas/ShiftHistoryTab"

import React, { useEffect, useState } from "react";

export default function GondolaDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const fetchGondolaById = useAppStore((state) => state.fetchGondolaById);
  const [gondola, setGondola] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);
    fetchGondolaById(id)
      .then((data) => {
        if (!isMounted) return;
        if (!data) throw new Error("Not found");
        setGondola(data);
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err.message || "Failed to fetch");
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [id, fetchGondolaById]);

  console.log('gondola',gondola)

  return (
    <div className="p-6">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/gondolas">
          <Button variant="outline" size="icon" className="h-8 w-8">
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">Gondola {gondola?.serialNumber || id}</h1>
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${gondola?.status === 'deployed' ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-600'}`}>
              {gondola?.status || '-'}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-500">ID:</span>
              <span className="ml-2 font-medium">{gondola?.id || id}</span>
            </div>
            <div>
              <span className="text-gray-500">Serial Number:</span>
              <span className="ml-2 font-medium">{gondola?.serialNumber || '-'}</span>
            </div>
            <div>
              <span className="text-gray-500">Location:</span>
              <span className="ml-2 font-medium">{gondola?.location || '-'}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-6">
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <MapPin className="h-5 w-5 text-blue-600" />
              </div>
              <h2 className="text-sm font-semibold text-gray-700">Location</h2>
            </div>
            <div className="space-y-2">
              <div>
                <p className="text-sm text-gray-500">Current Location</p>
                <p className="font-semibold text-gray-900">{gondola?.location || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Elevation</p>
                <p className="font-medium text-gray-700">North</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Calendar className="h-5 w-5 text-green-600" />
              </div>
              <h2 className="text-sm font-semibold text-gray-700">Deployment</h2>
            </div>
            <div className="space-y-2">
              <div>
                <p className="text-sm text-gray-500">Deployed Date</p>
                <p className="font-semibold text-gray-900">{gondola?.createdAt ? new Date(gondola.createdAt).toLocaleDateString() : '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Duration</p>
                <p className="font-medium text-green-600">{/* Calculate duration if possible */}
                  {gondola?.createdAt ? `${Math.floor((Date.now() - new Date(gondola.createdAt).getTime()) / (1000 * 60 * 60 * 24))} days active` : '-'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-purple-600" />
              </div>
              <h2 className="text-sm font-semibold text-gray-700">Last Inspection</h2>
            </div>
            <div className="space-y-2">
              <div>
                <p className="text-sm text-gray-500">Completed</p>
                <p className="font-semibold text-gray-900">{gondola?.lastInspection ? new Date(gondola.lastInspection).toLocaleDateString() : '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <p className="font-medium text-green-600">Passed</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Clock className="h-5 w-5 text-orange-600" />
              </div>
              <h2 className="text-sm font-semibold text-gray-700">Next Inspection</h2>
            </div>
            <div className="space-y-2">
              <div>
                <p className="text-sm text-gray-500">Due Date</p>
                <p className="font-semibold text-gray-900">{gondola?.nextInspection ? new Date(gondola.nextInspection).toLocaleDateString() : '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Time Remaining</p>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <p className="font-medium text-orange-600">52 days</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <FileText className="h-5 w-5 text-indigo-600" />
              </div>
              <h2 className="text-sm font-semibold text-gray-700">Linked Project</h2>
            </div>
            <div className="space-y-2">
              <div>
                <p className="text-sm text-gray-500">Project ID</p>
                {gondola?.projects[0]?.id ? (
                  <Link
                    href={`/projects/${gondola.projects[0]?.id}`}
                    className="font-semibold text-indigo-600 hover:text-indigo-800 hover:underline"
                  >
                    {gondola.projects[0]?.id}
                  </Link>
                ) : (
                  <span className="font-medium text-gray-700">-</span>
                )}
              </div>
              <div>
                <p className="text-sm text-gray-500">Project Manager</p>
                {gondola?.projectManagerName ? (
                  <>
                    <p className="font-medium text-gray-700">{gondola.projects[0]?.managerName}</p>
                    {gondola.projectManagerEmail && (
                      <p className="text-xs text-gray-500">{gondola.projects[0]?.managerEmail}</p>
                    )}
                  </>
                ) : (
                  <span className="font-medium text-gray-700">-</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="documents">
        <TabsList className="mb-6">
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="photos">Photos</TabsTrigger>
          <TabsTrigger value="inspections">Inspections</TabsTrigger>
          <TabsTrigger value="maintenance-adhoc">Adhoc Deployment</TabsTrigger>
          <TabsTrigger value="shift-history">Shift History</TabsTrigger>
          <TabsTrigger value="rental-details">Rental Details</TabsTrigger>
          <TabsTrigger value="orientation-session">Orientation Session</TabsTrigger>
        </TabsList>
        <TabsContent value="documents">
          <DocumentsTab gondolaId = {id} />
        </TabsContent>
        <TabsContent value="photos">
          <PhotosTab gondolaId = {id}/>
        </TabsContent>
        <TabsContent value="inspections">
          <InspectionsTab gondolaId={id} />
        </TabsContent>
        <TabsContent value="maintenance-adhoc">
          <MaintenanceAdhocTab gondolaId={id} />
        </TabsContent>
        <TabsContent value="shift-history">
          <ShiftHistoryTab gondolaId={id} />
        </TabsContent>
        <TabsContent value="rental-details">
          <RentalDetailsTab gondolaId={id} />
        </TabsContent>
        <TabsContent value="orientation-session">
          <OrientationSessionTab gondolaId={id} />
        </TabsContent>
      </Tabs>
    </div>
  )
}









