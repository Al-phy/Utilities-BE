/**
 * Common Controller
 * Handles shared/common API endpoints across the application
 */

/**
 * Get Basic Data (Classes, Subjects, Batches)
 * @route POST /api/get/basic/json
 * @access Public/Protected (depending on your auth setup)
 */
export const getBasicData = (req, res) => {
  try {
    // Constants
    const ID_1 = "1", ID_2 = "2", ID_3 = "3";
    const BATCH_A = "A", BATCH_B = "B", BATCH_C = "C";
    const CLASS_1 = "1", CLASS_2 = "2", CLASS_3 = "3";
    
    // Batches data
    const _BATCHES = [
      { _id: ID_1, name: BATCH_A },
      { _id: ID_2, name: BATCH_B },
      { _id: ID_3, name: BATCH_C }
    ];
    
    // Classes data with associated batches
    const _CLASSES = [
      { _id: ID_1, name: CLASS_1, batches: [_BATCHES[0], _BATCHES[1]] },
      { _id: ID_2, name: CLASS_2, batches: [_BATCHES[0], _BATCHES[1]] },
      { _id: ID_3, name: CLASS_3, batches: [_BATCHES[0], _BATCHES[1], _BATCHES[2]] }
    ];
    
    // Subjects data
    const SUBJECTS = [
      { _id: ID_1, name: "ENGLISH" },
      { _id: ID_2, name: "MATHS" },
      { _id: ID_3, name: "SCIENCE" }
    ];
    
    // Send response
    res.status(200).json({
      success: true,
      data: {
        classes: _CLASSES,
        subjects: SUBJECTS
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching basic data",
      error: error.message
    });
  }
};

// Export other common controllers here as needed
// export const anotherController = (req, res) => { ... };