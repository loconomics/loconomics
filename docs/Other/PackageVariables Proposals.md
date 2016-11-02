PackageVariables proposal database scheme
-----------------------------------------

## Initial variables
For housekeeper, hourly and babysitter pricing, we have next variables:

    - CleaningRate:decimal      provider rate cleaning 2beds and 2baths, for all cleaning pricing types
    - BedsNumber:int            customer value specifing the number of beds to clean, for all cleaning pricing types
    - BathsNumber:int           customer value specifing the number of bats to clean, for all cleaning pricing types
    - HoursNumber:decimal       customer value specifing the number of hours for the service, for hourly and babysitter pricing. Can be in minutes instead of in hours.
    - ChildsNumber:int          customer value specifing the number of childs, for babysitter pricing only.
    - ChildSurcharge:decimal    provider value specifing the extra price per extra child, for babysitter pricing only


##Proposal A

One table to hold values with table fields/columns per variable.
We doesn't need a table to define variables because they are already defined as columns with name and data-type. All are optional (can be null) and be used only for pricings
requiring it, with possibility to be reused between different pricings

###Scheme [PackageVariables]
    - UserID:int                provider or customer UserID
    - PackageID:int             package with that value
    - BookingId:int             will be 0 for provider values, and the BookingID for the customer values during booking. Maybe it can be the PricingEstimateID instead of BookingID
    - CleaningRate:decimal      can be null
    - BedsNumber:int            can be null
    - BathsNumber:int           can be null
    - HoursNumber:decimal       (or maybe minutes) can be null
    - ChildsNumber:int          can be null
    - ChildSurcharge:decimal    can be null

###System data
There is no need to define records with variables because they are self-defined in the table columns.

Note that is not good to have a large list of columns in a table, but this way they can be quicker and easier reused and accessed.


##Proposal B

Two tables: one to define what variables there are, and other one with values from provider and customer.

Its more similar to previous approach for variables, but re-thinking the fields we really need and using only one table for both provider and customer values.

###Scheme [PackageVariablesDefinition]
    - VariableID:int            identifier for the variable
    - InternalName:varchar      name of the variable. I prefer name it as 'InternalName' to be clear that
                                is Not a name to be translated or to show to the user and needs be hardcoded to do
                                specific things in code specific for to the variable meaning.
    - PricingTypeID:int         referencing for what pricing type will use this variable.
                                Variables shared by different pricing types need a duplicated record with the
                                different PricingTypeID (for example the three cleaning pricing types needs CleaningRate,
                                BedsNumber and BathsNumber, the HoursNumber for hourly and babysitter)
    - CP:char                   is a Customer variable or a Provider variable?
                                Possible values: 'C' or 'P' (maybe 'B' for 'both').
                                Maybe is not required because variable names are hardcoded and used only what the specific code need.
    - DataType:nvarchar         it sets what kind of data we are saving as value for this variable: decimal, integer, text, bool.
                                If will be only numeric values, we can remove this and use 'decimal' as data type ever.

###Scheme [PackageVariablesValues]
    - VariableID:int            references the variable
    - UserID:int                provider or customer identifier
    - PackageID:int             provider package that uses this value
    - BookingID:int             will be 0 for provider values, and the BookingID for the customer values during booking.
                                Maybe it can be the PricingEstimateID instead of BookingID
    - Value:nvarchar            the variable value saved as text to allow hold any kind of data type.
                                It requires conversions of the text to the defined variable DataType on any code using variables,
                                to allow do calculation and formatting.
                                It can be changed to 'decimal' if we consider we will hold only numeric values.

###System data [PackageVariablesDefinition]
<table>
 <tr>
  <th>VariableID</th><th>      InternalName</th><th>        PricingTypeID</th><th>       CP</th><th>      DataType</th>
 </tr>
 <tr>
  <td>1</td><td>               'CleaningRate'</td><td>      9</td><td>                   'P'</td><td>     'decimal'</td>
 </tr>
 <tr>
  <td>1</td><td>               'CleaningRate'</td><td>      10</td><td>                  'P'</td><td>     'decimal'</td>
 </tr>
 <tr>
  <td>1</td><td>               'CleaningRate'</td><td>      11</td><td>                  'P'</td><td>     'decimal'</td>
 </tr>
 <tr>
  <td>2</td><td>               'BedsNumber'</td><td>        9</td><td>                   'C'</td><td>     'int'</td>
 </tr>
 <tr>
  <td>2</td><td>               'BedsNumber'</td><td>        10</td><td>                  'C'</td><td>     'int'</td>
 </tr>
 <tr>
  <td>2</td><td>               'BedsNumber'</td><td>        11</td><td>                  'C'</td><td>     'int'</td>
 </tr>
 <tr>
  <td>3</td><td>               'BathsNumber'</td><td>       9</td><td>                   'C'</td><td>     'int'</td>
 </tr>
 <tr>
  <td>3</td><td>               'BathsNumber'</td><td>       10</td><td>                  'C'</td><td>     'int'</td>
 </tr>
 <tr>
  <td>3</td><td>               'BathsNumber'</td><td>       11</td><td>                  'C'</td><td>     'int'</td>
 </tr>
 <tr>
  <td>4</td><td>               'HoursNumber'</td><td>       1</td><td>                   'C'</td><td>     'decimal'</td>
 </tr>
 <tr>
  <td>4</td><td>               'HoursNumber'</td><td>       16? (babysitter)</td><td>    'C'</td><td>     'decimal'</td>
 </tr>
 <tr>
  <td>5</td><td>               'ChildsNumber'</td><td>      16? (babysitter)</td><td>    'C'</td><td>     'integer'</td>
 </tr>
 <tr>
  <td>6</td><td>               'ChildSurcharge'</td><td>    16? (babysitter)</td><td>    'P'</td><td>     'decimal'</td>
 </tr>
</table>

Note that this proposal requires more things to do the same, repeated variable records per pricing, extra code to do conversions, find variables and data is not saved 'as is'.
**Its good to have a large list of variables**, but still think that any new variable on both cases require new code for the pricing and variable (variables are not showed automatically
in a list as previoulsy was done with the 'custom' pricing type, because we require now more complex calculations that affect multiple variables and not 'one per line' and specific
UI to be smart and easier for our users.

##Proposal B++


###Scheme [PricingVariablesDefinition]
    - PricingVariableID:int         identifier for the variable
    - LanguageID: int
    - CountryID: int
    - PositionID:int                maps variable to position;  "-1" for all positions
    - InternalName:varchar          name of the variable. I prefer name it as 'InternalName' to be clear that
                                    is Not a name to be translated or to show to the user and needs be hardcoded to do
                                    specific things in code specific for to the variable meaning.
    - PricingTypeID:int             referencing for what pricing type will use this variable.
                                    Variables shared by different pricing types need a duplicated record with the
                                    different PricingTypeID (for example the three cleaning pricing types needs CleaningRate,
                                    BedsNumber and BathsNumber, the HoursNumber for hourly and babysitter)
    - IsProviderVariable:bit        Provider Variable
    - IsCustomerVariable:bit        Customer Variable
    - DataType:nvarchar             it sets what kind of data we are saving as value for this variable: decimal, integer, text, bool.
                                    If will be only numeric values, we can remove this and use 'decimal' as data type ever.
    - VariableLabel: varchar        Label given to the provider when entering it in the form in the dashboard
    - VariableLabelPopUp: varchar   Text that will be in pop-up for ProviderLabel
    - VariableNameSingular: varchar Singular name of variable to be used in front-end content to customer and provider
    - VariableNamePlural: varchar   Plural name of variable to be used in front-end content to customer and provider
    - NumberIncludedLabel: varchar  Label given to the provider/customer when entering it in the form (can be null)
    - NumberIncludedLabelPopup:     Text that will be in pop-up for NumberIncludedLabel
    - CalculateWithVariableID: int  Variable to match customer and provider variable inputs
    
EXAMPLE INPUTS
###System data [PricingVariablesDefinition]
<table>
 <tr>
  <th>PricingVariableID</th><th>      LanguageID</th><th>      CountryID</th><th>      PositionID</th><th>      InternalName</th><th>        PricingTypeID</th><th>       IsProviderVariable</th><th>      IsCustomerVariable</th><th>      DataType</th><th>      VariableLabel</th><th>      VariableLablePopUp</th><th>      VariableNameSingular</th><th>      VariableNamePlural</th><th>      NumberIncludedLabel</th><th>      NumberIncludedLabelPopUp</th><th>      CalculateWithVariableID</th>
 </tr>
 <tr>
  <td>1</td><td>        1</td><td>        1</td><td>        -1 </td><td>               'HourlyRate'</td><td>      1</td><td>                   1</td><td>                   0</td><td>     'decimal'</td><td>     'Hourly Rate'</td><td>     'Please enter your hourly rate for these services'</td><td>     'hour'</td><td>     'hours'</td><td>     NULL</td><td>     NULL</td><td>     NULL</td>
 </tr>
 <tr>
  <td>2</td><td>        1</td><td>        1</td><td>        -1 </td><td>               'Hours'</td><td>      1</td><td>                   0</td><td>                   1</td><td>     'decimal'</td><td>     'Hours'</td><td>     'Please select the number of hours'</td><td>     'hour'</td><td>     'hours'</td><td>     NULL</td><td>     NULL</td><td>     1</td>
 </tr>
 <tr>
  <td>3</td><td>        1</td><td>        1</td><td>        16</td><td>               'ChildSurcharge'</td><td>      1</td><td>                   1</td><td>                   0</td><td>     'decimal'</td><td>     'additional child'</td><td>     'Please indicate how many children your hourly rate includes and the hourly surcharge, if any, per additional child.'</td><td>     'child'</td><td>     'children'</td><td>     NULL</td><td>     NULL</td><td>     NULL</td>
 </tr>
 <tr>
  <td>4</td><td>        1</td><td>        1</td><td>        16</td><td>               'NumberOfChildren'</td><td>      1</td><td>                   0</td><td>                   1</td><td>     'int'</td><td>     'Number of Children'</td><td>     'Please indicate how many children you'd like babysat'</td><td>     'child'</td><td>     'children'</td><td>     NULL</td><td>     NULL</td><td>     3</td>
 </tr>
    
  
</table>

###Scheme [PricingVariablesValues]
    - UserID: int                   identifier for user (can be provider or customer)
    - ProviderPackageID:int         identifier for the package (null if customer variable)
    - PricingVariableID:int         identifier for the variable
    - Value:nvarchar                the variable value saved as text to allow hold any kind of data type.
                                    It requires conversions of the text to the defined variable DataType on any code using variables,
                                    to allow do calculation and formatting.
                                    It can be changed to 'decimal' if we consider we will hold only numeric values.
                                    INPUT FOR PROVIDER IN DASHBOARD
                                    INPUT FOR CUSTOMER IN BOOKING STEP 1
    - ProviderNumberIncluded:decimal        The number of the variable type that is included in the package. Will be null for hours and defaulted
                                    to 1 for all others (providers can change this).  Null if customer.
    - ProviderMinNumberAllowed:decimal      Will be used for hourly variable only (and null for all others).  May be used in "Classes" 
                                    pricing type in future for min students.   Null if customer.
    - ProviderMaxNumberAllowed:decimal      Will be used for max number of hours and also max number of a variable (if a babysitter 
                                    can only babysit 4 children for example).   Null if customer.

<table>
 <tr>
  <th>UserID</th><th>ProviderPackageID</th><th>PricingVariableID</th><th>Value</th><th>ProviderNumberIncluded</th><th>ProviderMinNumberAllowed</th><th>ProviderMaxNumberAllowed</th>
 </tr>
 <tr>
  <td>162</td><td>-1</td><td>1</td><td>25.00</td><td>NULL</td><td>1.5</td><td>8</td>
 </tr>
 <tr>
  <td>162</td><td>24</td><td>3</td><td>5.00</td><td>2</td><td>NULL</td><td>4</td>
 </tr>
 <tr>
  <td>319</td><td>NULL</td><td>4</td><td>4</td><td>NULL</td><td>NULL</td><td>NULL</td>
 </tr>
</table>
 
 
###Scheme [PricingEstimateDetail]  -Fields used
    - PricingEstimateID:int         identifier for the pricing estimate
    - PricingEstimateRevision
    - PricingVariableID:int         identifier for the variable
    - PricingSurchargeID            Never used, can be removed
    - PricingOptionID               Still used?? Its used for positions that has options attached, something possible with packages; if we will not use options with packages anymore, can be removed (previous code clean-up).
    - ServiceAttributeID            Still used?? Its used when service-attributes are selectable during pricing-booking, that happened with old custom-pricing; could be removed (previous code clean-up), when removed the custom-pricing code.
    - ProviderPackageID: int        identifier for the package
    - ProviderPricingDataInput:     from PricingVariables.Value  
    - CustomerPricingDataInput:     from PricingVariables.Value from customer ID
    - SystemPricingDataInput:       calculation using pricing type code. *it needs some clarification, it was never used until now for packages*
    - HourlyPrice:                  uses provider input for variableID 1 and userID plus commission. -> Needs hardcode reference to VariableID:1 to get its value to be set here, right? For variables that calculate with provider-value HourlyRate will repeat this value on the ProviderPricingDataInput, on others this value has no sense (is not used in calculation). Currently, the value to be set here was being get from the table [providerhourlyrate], maybe is time to remove that previous code clean-up. We have too a field [PriceRate] being used for HourlyPrice on some packages and new Housekeeper implementation.
    - SubtotalPrice
    - FeePrice
    - TotalPrice
    - ServiceDuration
    - FirstSessionDuration
    - CreatedDate
    - UpdatedDate
    - ModifiedBy
    - PricingGroupID

###Example data for [PricingEstimateDetail] 
Example data for 1 PricingEstimate with additional *comments* and TOTALS row with its summary data at [PricingEstimate] table.
It contains a package for Babysitter (that use variables) and an add-on (a real example name for the add-on is welcome). Amounts maybe are not real but are easy to calculate :-)

<table>
 <tr>
  <th><em>Comment</em></th>
  <th>PricingEstimateID</th>
  <th>PricingEstimateRevision</th>
  <th>PricingVariableID</th>
  <th>ProviderPackageID</th>
  <th>ProviderPricingDataInput</th>
  <th>CustomerPricingDataInput</th>
  <th>SystemPricingDataInput</th>
  <th>HourlyPrice</th>
  <th>SubtotalPrice</th>
  <th>FeePrice</th>
  <th>TotalPrice</th>
  <th>ServiceDuration</th>
  <th>FirstSessionDuration</th>
  <th>PricingGroupID</th>
 </tr>
 <tr>
  <td><em>Selected package: babysitter</em></td>
  <td>123</td>
  <td>1</td>
  <td>0</td>
  <td>34</td>
  <td>NULL</td>
  <td>NULL</td>
  <td>NULL</td>
  <td>NULL <em>(from [ProviderPackage].[PriceRate])</em></td>
  <td>$100.00 <em>(from variables calculation)</em></td>
  <td>$5.00</td>
  <td>$105.00</td>
  <td>4 hours <em>(from variables calculation)</em></td>
  <td>4 hours <em>(from variables calculation)</em></td>
  <td>4</td>
 </tr>
 <tr>
  <td><em>Provider Variable</em></td>
  <td>123</td>
  <td>1</td>
  <td>1 <em>HourlyRate</em></td>
  <td>34 <em>related package</em></td>
  <td>'20.00' <em>(HourlyRate var value)</em></td>
  <td>NULL</td>
  <td>NULL</td>
  <td>$20.00 <em>(from VariableID:1, same as ProviderDataInput, but saved as decimal number)</em></td>
  <td>NULL <em>(nothing to calculate, provider value)</em></td>
  <td>NULL</td>
  <td>NULL</td>
  <td>NULL</td>
  <td>NULL</td>
  <td>4</td>
 </tr>
 <tr>
  <td><em>Customer Variable</em></td>
  <td>123</td>
  <td>1</td>
  <td>2 <em>Hours</em></td>
  <td>34 <em>related package</em></td>
  <td>'20.00' <em>(HourlyRate var value)</em></td>
  <td>'4.00' <em>(Hours var value)</em></td>
  <td>NULL <em>(What goes here?)</em></td>
  <td>$20.00 <em>(from VariableID:1, same as ProviderDataInput, but saved as decimal number)</em></td>
  <td>$80.00</td>
  <td>$4.00</td>
  <td>$84.00</td>
  <td>4 hours</td>
  <td>4 hours</td>
  <td>4</td>
 </tr>
 <tr>
  <td><em>Provider Variable</em></td>
  <td>123</td>
  <td>1</td>
  <td>3 <em>ChildSurcharge</em></td>
  <td>34 <em>related package</em></td>
  <td>'10.00' <em>(ChildSurcharge var value)</em></td>
  <td>NULL</td>
  <td>NULL</td>
  <td>$20.00 <em>(from VariableID:1 but saved as decimal number)</em></td>
  <td>NULL <em>(nothing to calculate, provider value)</em></td>
  <td>NULL</td>
  <td>NULL</td>
  <td>NULL</td>
  <td>NULL</td>
  <td>4</td>
 </tr>
 <tr>
  <td><em>Customer Variable</em></td>
  <td>123</td>
  <td>1</td>
  <td>4 <em>NumberOfChildren</em></td>
  <td>34 <em>related package</em></td>
  <td>'10.00' <em>(ChildSurcharge var value)</em></td>
  <td>'3' <em>(NumberOfChildren var value)</em></td>
  <td>NULL <em>(What goes here?)</em></td>
  <td>$20.00 <em>(from VariableID:1, same as ProviderDataInput, but saved as decimal number)</em></td>
  <td>$20.00</td>
  <td>$1.00</td>
  <td>$21.00</td>
  <td>NULL</td>
  <td>NULL</td>
  <td>4</td>
 </tr>
 <tr>
  <td><em>A babysitter add-on</em></td>
  <td>123</td>
  <td>1</td>
  <td>NULL</td>
  <td>37</td>
  <td>NULL</td>
  <td>NULL</td>
  <td>NULL</td>
  <td>NULL <em>(from [ProviderPackage].[PriceRate])</em></td>
  <td>$30.00</td>
  <td>$1.50</td>
  <td>$1.50</td>
  <td>NULL <em>(some add-ons may require extra time, reflected in the totals and schedule)</em></td>
  <td>NULL <em>(some add-ons may require extra time, reflected in the totals and schedule)</em></td>
  <td>5</td>
 </tr>
 <tr>
  <th><em>TOTALS at [PricingEstimate]</em></th>
  <th>123</th>
  <th>1</th>
  <th></th>
  <th></th>
  <th></th>
  <th></th>
  <th></th>
  <th>NULL <em>from package or</em> $20.00 <em>from VariableID:1</em>?</th>
  <th>$130.00</th>
  <th>$6.50</th>
  <th>$136.50</th>
  <th>4 hours</th>
  <th>4 hours</th>
  <th></th>
 </tr>
</table>

Provider variables values being used by this booking/pricing-estimate:
<table>
 <tr>
  <th>UserID</th>
  <th>ProviderPackageID</th>
  <th>PricingVariableID</th>
  <th>Value</th>
  <th>ProviderNumberIncluded</th>
  <th>ProviderMinNumberAllowed</th>
  <th>ProviderMaxNumberAllowed</th>
 </tr>
 <tr>
  <td>131</td>
  <td>34</td>
  <td>1 <em>HourlyRate</em></td>
  <td>'20.00'</td>
  <td>1.5</td>
  <td>NULL</td>
  <td>8</td>
 </tr>
 <tr>
  <td>131</td>
  <td>34</td>
  <td>3 <em>ChildSurcharge</em></td>
  <td>'10.00'</td>
  <td>1</td>
  <td>1</td>
  <td>4</td>
 </tr>
</table>

###Notes
- It seems clear from the previous example that provider VariableIDs doesn't require being added to [PricingEstimateDetail], they are included in the Customer VariableID row (with value in the ProviderPricingDataInput column but without VariableID)
- Remember that we need lines per package in [PricingEstimateDetail] because customer could add add-ons to the booking (add-ons are packages actually).
- I'm thinking in the need for [RevisionID] in the [ProviderPackage] table, being used as Key with the [ProviderPackageID] and referenced on related tables (as [PricingVariablesValues] and [PricingEstimateDetail]); it adds one more field on any related table and a bit more complication, but could let us save a copy of every change provider does when saving a package, showing ever the last revision but with a reference from pricing to the actual state of the package in the moment the booking was done, preventing future changes to don't match the data when booked.
- General formula for variables in hourly pricings (some pricings may require alternative formulas, as Housekeeper, but the rest will use this):
    <pre>
    hours*hourlyrate +
    hours*((CustomerValueInputVariable1-ProviderNumberIncludedVariable1)*ProviderPriceVariable1
    +
    (CustomerValueInputVariable2-ProviderNumberIncludedVariable2)*ProviderPriceVariable2
    +
    (CustomerValueInputVariable3-ProviderNumberIncludedVariable3)*ProviderPriceVariable3
    +
    ....)
    </pre>

##Modification proposal for [PricingEstimateDetail]
Question: Its better save Variables on [PricingEstimateDetail] table or in the [PricingVariablesValues] table?
On last case: we add PricingEstimateID and PricingEstimateRevision fields, with value 0 for providers value.

This is an altenative approach to save customer variables values for the case of a booking/pricing-estimate, its remove VariableID from [PricingEstimateDetail] and some more related clean-up, and save variables values in only one place, to have both provider and customer values in the table [PricingVariablesValues].
Next is an example of this proposal, to compare and to discuss about. The example data is the same as in the previous example but with the alternative scheme:

###[PricingEstimateDetail] example values
<table>
 <tr>
  <th><em>Comment</em></th>
  <th>PricingEstimateID</th>
  <th>PricingEstimateRevision</th>
  <th>ProviderPackageID</th>
  <th>SubtotalPrice</th>
  <th>FeePrice</th>
  <th>TotalPrice</th>
  <th>ServiceDuration</th>
  <th>FirstSessionDuration</th>
  <th>PricingGroupID</th>
 </tr>
 <tr>
  <td><em>Selected package: babysitter</em></td>
  <td>123</td>
  <td>1</td>
  <td>34</td>
  <td>$100.00 <em>(from variables calculation)</em></td>
  <td>$5.00</td>
  <td>$105.00</td>
  <td>4 hours <em>(from variables calculation)</em></td>
  <td>4 hours <em>(from variables calculation)</em></td>
  <td>4</td>
 </tr>
 <tr>
  <td><em>A babysitter add-on</em></td>
  <td>123</td>
  <td>1</td>
  <td>37</td>
  <td>$30.00</td>
  <td>$1.50</td>
  <td>$1.50</td>
  <td>NULL <em>(some add-ons may require extra time, reflected in the totals and schedule)</em></td>
  <td>NULL <em>(some add-ons may require extra time, reflected in the totals and schedule)</em></td>
  <td>5</td>
 </tr>
 <tr>
  <th><em>TOTALS at [PricingEstimate]</em></th>
  <th>123</th>
  <th>1</th>
  <th></th>
  <th>$130.00</th>
  <th>$6.50</th>
  <th>$136.50</th>
  <th>4 hours</th>
  <th>4 hours</th>
  <th></th>
 </tr>
</table>

####[PricingVariableValues]
<table>
 <tr>
  <th>UserID</th>
  <th>PricingEstimateID</th>
  <th>PricingEstimateRevision</th>
  <th>ProviderPackageID</th>
  <th>PricingVariableID</th>
  <th>Value</th>
  <th>ProviderNumberIncluded</th>
  <th>ProviderMinNumberAllowed</th>
  <th>ProviderMaxNumberAllowed</th>
 </tr>
 <tr>
  <td>162</td>
  <td>123</td>
  <td>1</td>
  <td>34</td>
  <td>1 <em>HourlyRate</em></td>
  <td>'20.00'</td>
  <td>1.5</td>
  <td>NULL</td>
  <td>8</td>
 </tr>
 <tr>
  <td>162</td>
  <td>123</td>
  <td>1</td>
  <td>34</td>
  <td>2 <em>Hours</em></td>
  <td>'4.00'</td>
  <td>NULL</td>
  <td>NULL</td>
  <td>NULL</td>
 </tr>
 <tr>
  <td>162</td>
  <td>123</td>
  <td>1</td>
  <td>34</td>
  <td>3 <em>ChildSurcharge</em></td>
  <td>'10.00'</td>
  <td>1</td>
  <td>1</td>
  <td>4</td>
 </tr>
 <tr>
  <td>162</td>
  <td>123</td>
  <td>1</td>
  <td>34</td>
  <td>4 <em>NumberOfChildren</em></td>
  <td>'3.00'</td>
  <td>NULL</td>
  <td>NULL</td>
  <td>NULL</td>
 </tr>
 <tr>
  <td colspan="9">
   <em>Next Records: provider variables values being used by the booking/pricing-estimate (and copied with a PricingEstimateID in previuos records)</em>
  </td>
 </tr>
 <tr>
  <td>131</td>
  <td>0</td>
  <td>0</td>
  <td>34</td>
  <td>1 <em>HourlyRate</em></td>
  <td>'20.00'</td>
  <td>1.5</td>
  <td>NULL</td>
  <td>8</td>
 </tr>
 <tr>
  <td>131</td>
  <td>0</td>
  <td>0</td>
  <td>34</td>
  <td>3 <em>ChildSurcharge</em></td>
  <td>'10.00'</td>
  <td>1</td>
  <td>1</td>
  <td>4</td>
 </tr>
</table>

##Last notes

Pricing formulas will still be coded instead of defined in database, as they can vary syntax depending on pricing, it allow us more possibilities and it calculates using all variables and differently depending on provider calculation or customer calculation. Previous use of variables ('custom' pricing) only required calculations per each variable in a set of reduced possibilites.

Tables will have too the common fields: CreatedDate, UpdatedDate, ModifiedBy and Active on tables that require it.
