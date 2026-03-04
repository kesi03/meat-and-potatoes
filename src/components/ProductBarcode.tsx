import React from "react";
import Barcode from "react-barcode";

type Props = {
  value: string; // e.g. "5012345678900"
};

export const ProductBarcode: React.FC<Props> = ({ value }) => {
  return (
    <div>
      <Barcode
        value={value}
        format="EAN13"        // or "UPC", "CODE128", etc.
        width={2}
        height={80}
        displayValue={true}  // show the number under the bars
        background="#ffffff"
        lineColor="#000000"
      />
    </div>
  );
};