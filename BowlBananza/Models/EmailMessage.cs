using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace BowlBananza.Models
{
    public class EmailMessage
    {
        public string Subject { get; set; }

        public string MessageBodyText { get; set; }
        public string MessageBodyHtml { get; set; }
        public string FromAddress { get; set; }
        public string FromName { get; set; }
        public string ToAddress { get; set; }
        public string CCAddress { get; set; }
        public byte[] AttachmentData { get; set; }
        public string AttachmentName { get; set; }
        public string ContentType { get; set; }

        public List<AttachmentObj> Attachments { get; set; }

        public string BccAddresses { get; set; }

        public bool IsValid()
        {
            return
                !string.IsNullOrEmpty(ToAddress) &&
                !string.IsNullOrEmpty(FromAddress) &&
                (!string.IsNullOrEmpty(MessageBodyText) || !string.IsNullOrEmpty(MessageBodyHtml));
        }
    }
}