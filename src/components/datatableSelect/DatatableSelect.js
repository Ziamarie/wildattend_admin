import "./datatableSelect.css";
import { DataGrid } from "@mui/x-data-grid";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { collection, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { db } from "../../firebase";

const DatatableSelect = ({ entity, tableTitle, entityColumns, id, entityAssign }) => {
  const navigate = useNavigate(); // Access to the navigate function
  const [data, setData] = useState([]);
  const [selectedRowIds, setSelectedRowIds] = useState([]); // Track the selected row ids

  useEffect(() => {
    //LISTEN (REALTIME)
    console.log(entity); // Inspect the value of entity
  
    const fetchData = async () => {
      try {
        // Extract the entity ID from the URL
        const parts = location.pathname.split("/");
        const entityId = parts[parts.length - 2]; // Get the second last part of the URL
  
        // Query the "userClasses" collection to get all the documents
        const userClassesSnapshot = await getDocs(collection(db, "userClasses"));
  
        // Extract the IDs of classes/users already associated with the specific user/class
        const associatedIDs = userClassesSnapshot.docs
          .filter(doc => {
            return location.pathname.startsWith("/users/") ?
              doc.data().userID === entityId :
              doc.data().classID === entityId;
          })
          .map(doc => {
            return location.pathname.startsWith("/users/") ?
              doc.data().classID :
              doc.data().userID;
          });
  
        // Query the entity collection (classes/users) to get all the documents
        const entitySnapshot = await getDocs(collection(db, entity));
  
        // Filter the data to exclude the classes/users that are already associated
        let filteredData = entitySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  
        // Check the URL path and filter out users with role "Faculty" if necessary
        if (location.pathname.startsWith("/classes/") && entity === "users") {
          filteredData = filteredData.filter(user => user.role !== "Faculty");
        }
  
        setData(filteredData);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
  
    fetchData();
  }, [entity, location.pathname]);
  
  
  const handleAdd = async (params) => {
    try {
      if (selectedRowIds.length === 0) {
        console.log("Please select a row");
        return;
      }
  
      const userRef = doc(db, 'users', id); // Assuming 'id' is the ID of the current user
      const classesToAdd = selectedRowIds.map(rowId => {
        const selectedRow = data.find(row => row.id === rowId);
        return { id: selectedRow.id, ...selectedRow };
      });
  
      // Update the user document to add the selected classes to the classes array
      await updateDoc(userRef, {
        classes: [...entityAssign, ...classesToAdd]
      });
  
      // Retrieve the updated user document to confirm the update
      const userDoc = await doc(db, 'users', id).get();
      const updatedClasses = userDoc.data().classes;
      console.log("Updated classes array:", updatedClasses);
      
      console.log("Classes added to user's classes array:", classesToAdd);
    } catch (error) {
      console.error("Error adding classes to user's classes array:", error);
    }
  };
  
  

  return (
    <div className="datatableSelect">
      <div className="datatableSelectTitle">
        {tableTitle}
        {/* ADD BUTTON */}
        <button
          style={{ textDecoration: "none", cursor: "pointer" }}
          className="linkdt"
          onClick={handleAdd}
          disabled={selectedRowIds.length === 0} // Disable button if no row is selected
        >
          Add
        </button>
      </div>
      <DataGrid
        rows={data}
        columns={entityColumns}
        pageSize={5}
        checkboxSelection
        onSelectionModelChange={(newSelection) => {
          setSelectedRowIds(newSelection.selectionModel); // Track the selected row ids
          console.log("Selected Row Ids:", newSelection.selectionModel); // Log selected row ids
        }}
      />

    </div>
  );
};

export default DatatableSelect;