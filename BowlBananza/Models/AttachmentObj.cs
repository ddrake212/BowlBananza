using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace BowlBananza.Models
{
    public class AttachmentObj
    {
        public byte[] AttachmentData { get; set; }
        public string AttachmentName { get; set; }
        public string ContentType { get; set; }

        public AttachmentObj()
        {

        }
    }
}