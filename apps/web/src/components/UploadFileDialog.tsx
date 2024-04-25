import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import FileUploadForm from "./UploadFile";

export function UploadFileDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Upload file</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Upload file</DialogTitle>
          <DialogDescription>
            Add a new pictures to your gallery
          </DialogDescription>
        </DialogHeader>
        <FileUploadForm />
      </DialogContent>
    </Dialog>
  );
}
